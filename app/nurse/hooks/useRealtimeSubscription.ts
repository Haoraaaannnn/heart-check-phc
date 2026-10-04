/**
 * @file useRealtimeSubscription.ts
 * @description Stabilized dual-mode Supabase Realtime subscription with automatic polling fallback
 * for the Nurse Dashboard. Designed for weak-signal resilience at the PHC.
 *
 * Operates in two modes:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    and triggers a debounced re-fetch. Zero polling overhead when the channel is healthy.
 * 2. Polling fallback (automatic): When the WebSocket channel drops, times out, or errors
 *    (common on weak WiFi during PHC OPD demos), the hook automatically activates a
 *    5-second polling interval so queue data remains current even without a live WebSocket.
 *
 * Weak-signal stabilization features (prevents queue teleporting/disappearing):
 * - Fetch sequence guard: discards stale responses that arrive after a newer fetch has started.
 * - Channel status hysteresis: delays polling activation by 2 seconds so brief channel flickers
 *   do not cause rapid poll start/stop cycles.
 * - Overlap guard: suppresses redundant concurrent fetches from realtime + poll collisions.
 *
 * @remarks
 * Designed for the PHC demo scenario: all devices on shared WiFi where the internet
 * uplink to Supabase cloud is weak. `navigator.onLine` returns `true` (WiFi associated)
 * but the Supabase WebSocket connection stalls or times out. The polling fallback bridges
 * this gap so the nurse station stays operational.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 *
 * @module app/nurse/hooks/useRealtimeSubscription
 */

"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChannelStatus } from "@/hooks/useConnectionStatus";

/**
 * Polling interval in milliseconds when the Supabase WebSocket is degraded.
 * 5 seconds: fast enough to keep nurse queue data current, slow enough to
 * avoid overwhelming a weak connection with repeated Supabase REST queries.
 */
const NURSE_POLL_INTERVAL_MS = 5_000;

/**
 * Grace period in milliseconds before activating the polling fallback after
 * the channel status degrades. Prevents rapid start/stop cycling when the
 * channel flickers between SUBSCRIBED and TIMED_OUT on weak signal.
 */
const CHANNEL_DEGRADED_GRACE_MS = 2_000;

/**
 * Minimum interval in milliseconds between consecutive fetch executions.
 * Prevents overlapping concurrent fetches from realtime events and poll
 * ticks colliding during signal recovery bursts.
 */
const FETCH_THROTTLE_MS = 500;

/**
 * Subscribes to real-time changes on the patients table with debounce, fetch
 * sequence guards, channel status hysteresis, and automatic polling fallback
 * when the Supabase Realtime WebSocket is degraded.
 *
 * @param onFetch - Callback function invoked when patient data should be re-fetched.
 * @param debounceMs - Milliseconds to debounce incoming real-time change events (default 300ms).
 * @param onStatusChange - Optional callback receiving the raw Supabase channel status string,
 *   used by the parent page to update `ConnectionStatusBanner` state.
 */
export function useRealtimeSubscription(
    onFetch: () => void,
    debounceMs: number = 300,
    onStatusChange?: (status: ChannelStatus) => void,
): void {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onFetchRef = useRef(onFetch);
    const onStatusChangeRef = useRef(onStatusChange);

    /**
     * Monotonically increasing counter used to detect and discard stale fetch
     * responses that arrive after a newer fetch has already been initiated.
     */
    const fetchIdRef = useRef<number>(0);

    /**
     * Timestamp of the last fetch execution start. Used by the overlap guard
     * to throttle concurrent fetches from different trigger sources.
     */
    const lastFetchAtRef = useRef<number>(0);

    /**
     * Timer handle for the channel degradation grace period. Delays polling
     * activation so brief channel status flickers do not cause start/stop storms.
     */
    const degradeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep latest callbacks without re-triggering the subscription effect.
    useEffect(() => {
        onFetchRef.current = onFetch;
    }, [onFetch]);

    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
    }, [onStatusChange]);

    useEffect(() => {
        let disposed = false;

        /**
         * Guarded fetch executor. Increments the fetch sequence counter and
         * checks elapsed time since the last fetch to prevent overlapping
         * concurrent requests from different trigger sources.
         *
         * @param source - Debug label for the fetch trigger origin (realtime, poll, online).
         */
        const guardedFetch = (source: string) => {
            const now = Date.now();
            if (now - lastFetchAtRef.current < FETCH_THROTTLE_MS) {
                return;
            }
            lastFetchAtRef.current = now;
            fetchIdRef.current++;
            if (!disposed) {
                onFetchRef.current();
            }
        };

        /**
         * Triggers a debounced fetch from the real-time event handler.
         * Coalesces rapid batch inserts/updates into a single re-fetch.
         */
        const handleUpdate = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                guardedFetch('realtime');
            }, debounceMs);
        };

        /**
         * Activates the polling fallback if not already running.
         * Called after the hysteresis grace period when the WebSocket channel
         * remains degraded.
         */
        const startPolling = () => {
            if (pollRef.current) return;
            // Trigger an immediate fetch so data is refreshed right when fallback activates.
            guardedFetch('poll-start');
            pollRef.current = setInterval(() => {
                guardedFetch('poll-tick');
            }, NURSE_POLL_INTERVAL_MS);
        };

        /**
         * Deactivates the polling fallback. Called when the WebSocket recovers.
         * Also cancels any pending degradation grace timer.
         */
        const stopPolling = () => {
            if (degradeTimerRef.current) {
                clearTimeout(degradeTimerRef.current);
                degradeTimerRef.current = null;
            }
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        /**
         * Handles channel status transitions with hysteresis. Immediately stops
         * polling on SUBSCRIBED, but delays polling activation by a grace period
         * to filter out brief channel flickers on weak signal.
         *
         * @param status - The Supabase channel status string.
         */
        const handleStatusChange = (status: ChannelStatus) => {
            if (disposed) return;
            onStatusChangeRef.current?.(status);

            if (status === "SUBSCRIBED") {
                stopPolling();
                // Fetch immediately on resubscription to reconcile any missed events
                guardedFetch('resubscribed');
            } else {
                // Channel degraded: apply hysteresis grace period before activating polling
                if (!pollRef.current && !degradeTimerRef.current) {
                    degradeTimerRef.current = setTimeout(() => {
                        degradeTimerRef.current = null;
                        if (!disposed) {
                            startPolling();
                        }
                    }, CHANNEL_DEGRADED_GRACE_MS);
                }
            }
        };

        const channel = supabase
            .channel("patients-nurse-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "patients" },
                () => handleUpdate(),
            )
            .subscribe((rawStatus) => {
                handleStatusChange(rawStatus as ChannelStatus);
            });

        // Browser online/offline events — trigger an immediate fetch on recovery.
        const handleOnline = () => {
            guardedFetch('online');
        };

        window.addEventListener("online", handleOnline);

        return () => {
            disposed = true;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            stopPolling();
            window.removeEventListener("online", handleOnline);
            void supabase.removeChannel(channel);
        };
    }, [debounceMs]);
}

export default useRealtimeSubscription;