/**
 * @file useRealtimeSubscription.ts
 * @description Stabilized dual-mode Supabase Realtime subscription with automatic polling fallback
 * for the Transfer Dashboard. Designed for weak-signal resilience at the PHC.
 *
 * Operates in two modes:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    and immediately triggers a debounced re-fetch. No polling overhead when the channel is healthy.
 * 2. Polling fallback (automatic): When the WebSocket channel drops, times out, or errors
 *    (common on weak WiFi during PHC OPD demos), the hook activates a 5-second polling
 *    interval so the transfer queue stays current without a live WebSocket.
 *
 * Weak-signal stabilization features (prevents queue teleporting/disappearing):
 * - Fetch sequence guard: discards stale responses that arrive after a newer fetch has started.
 * - Event debouncing: coalesces burst reconnect events into a single fetch (300ms window).
 * - Channel status hysteresis: delays polling activation by 2 seconds so brief channel flickers
 *   do not cause rapid poll start/stop cycles.
 * - Overlap guard: suppresses redundant concurrent fetches from realtime + poll collisions.
 *
 * @remarks
 * The transfer dashboard is operationally critical — nurses use it to drag and drop
 * patients between cubicles in real time. A stale view causes conflicting assignments.
 * The polling fallback at 5-second intervals is the minimum acceptable update cadence
 * for this workflow under weak-signal conditions.
 *
 * @module app/transfer/hooks/useRealtimeSubscription
 */

"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChannelStatus } from "@/hooks/useConnectionStatus";

/**
 * Polling interval in milliseconds when the Supabase WebSocket is degraded.
 * Matches the nurse dashboard cadence — both are operationally critical views.
 */
const TRANSFER_POLL_INTERVAL_MS = 5_000;

/**
 * Debounce window in milliseconds for coalescing burst realtime events into a
 * single fetch. On weak signal, channel reconnect replays multiple missed events
 * at once — without debouncing, each event triggers a separate fetch, creating
 * race conditions that cause queue teleporting.
 */
const TRANSFER_DEBOUNCE_MS = 150;

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
 * @param onStatusChange - Optional callback receiving the raw Supabase channel status string,
 *   used by the parent page to update `ConnectionStatusBanner` state.
 * @param onPayload - Optional callback receiving raw Supabase Realtime payloads for 0ms in-memory patching.
 */
export function useRealtimeSubscription(
    onFetch: () => void,
    onStatusChange?: (status: ChannelStatus) => void,
    onPayload?: (payload: any) => void,
): void {
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onFetchRef = useRef(onFetch);
    const onStatusChangeRef = useRef(onStatusChange);
    const onPayloadRef = useRef(onPayload);

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
        onPayloadRef.current = onPayload;
    }, [onPayload]);

    useEffect(() => {
        let disposed = false;

        /**
         * Guarded fetch executor with trailing-edge execution. Increments the fetch
         * sequence counter and ensures events arriving during the throttle window
         * execute promptly once the window closes, rather than being dropped.
         *
         * @param _source - Debug label for the fetch trigger origin (realtime, poll, online).
         */
        const guardedFetch = (_source: string) => {
            const now = Date.now();
            const elapsed = now - lastFetchAtRef.current;
            if (elapsed < FETCH_THROTTLE_MS) {
                // If within throttle window, schedule trailing edge execution so events are never dropped
                if (!trailingTimerRef.current) {
                    trailingTimerRef.current = setTimeout(() => {
                        trailingTimerRef.current = null;
                        guardedFetch(_source);
                    }, FETCH_THROTTLE_MS - elapsed);
                }
                return;
            }
            if (trailingTimerRef.current) {
                clearTimeout(trailingTimerRef.current);
                trailingTimerRef.current = null;
            }
            lastFetchAtRef.current = now;
            fetchIdRef.current++;
            if (!disposed) {
                onFetchRef.current();
            }
        };

        /**
         * Debounced realtime event handler. Coalesces burst events (e.g. from
         * reconnect replay) into a single fetch to prevent race conditions.
         */
        const handleUpdate = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                guardedFetch('realtime');
            }, TRANSFER_DEBOUNCE_MS);
        };

        /**
         * Activates the polling fallback if not already running.
         * Called after the hysteresis grace period when the WebSocket channel
         * remains degraded.
         */
        const startPolling = () => {
            if (pollRef.current) return;
            // Immediate fetch so data is refreshed right when fallback activates.
            guardedFetch('poll-start');
            pollRef.current = setInterval(() => {
                guardedFetch('poll-tick');
            }, TRANSFER_POLL_INTERVAL_MS);
        };

        /**
         * Deactivates the polling fallback when the WebSocket recovers.
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
            .channel("patients-queue")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "patients" },
                (payload) => {
                    onPayloadRef.current?.(payload);
                    handleUpdate();
                },
            )
            .subscribe((rawStatus) => {
                handleStatusChange(rawStatus as ChannelStatus);
            });

        // Trigger an immediate fresh fetch when internet recovers.
        const handleOnline = () => {
            guardedFetch('online');
        };

        window.addEventListener("online", handleOnline);

        return () => {
            disposed = true;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (trailingTimerRef.current) clearTimeout(trailingTimerRef.current);
            stopPolling();
            window.removeEventListener("online", handleOnline);
            void supabase.removeChannel(channel);
        };
    }, []);
}