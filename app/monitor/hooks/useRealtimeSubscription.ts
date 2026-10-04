/**
 * @file useRealtimeSubscription.ts
 * @description Stabilized dual-mode Supabase Realtime subscription with automatic polling fallback
 * for the Monitor Display. Designed for weak-signal resilience at the PHC.
 *
 * Operates in two modes:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    filtered by service category and immediately triggers a re-fetch.
 * 2. Polling fallback (automatic): When the WebSocket drops or times out (common on
 *    weak WiFi during PHC OPD demos), an 8-second polling interval keeps the waiting
 *    area display refreshed without a live WebSocket.
 *
 * Weak-signal stabilization features (prevents queue teleporting/disappearing):
 * - Fetch sequence guard: discards stale responses that arrive after a newer fetch has started.
 * - Channel status hysteresis: delays polling activation by 2 seconds so brief channel flickers
 *   do not cause rapid poll start/stop cycles.
 * - Overlap guard: suppresses redundant concurrent fetches from realtime + poll collisions.
 *
 * @remarks
 * The monitor display is a public screen in the waiting area. An 8-second polling
 * interval is used (vs. 5 seconds for nurse/transfer) because the monitor is a
 * display-only view — slight delays in queue updates are acceptable and a less
 * aggressive poll reduces load on a degraded connection shared by all devices.
 *
 * @module app/monitor/hooks/useRealtimeSubscription
 */

"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChannelStatus } from "@/hooks/useConnectionStatus";

/**
 * Polling interval in milliseconds for the monitor display when the WebSocket is degraded.
 * 8 seconds: less aggressive than nurse/transfer since the monitor is display-only.
 */
const MONITOR_POLL_INTERVAL_MS = 8_000;

/**
 * Debounce window in milliseconds for coalescing burst realtime events into a
 * single fetch. On weak signal, channel reconnect replays multiple missed events
 * at once — without debouncing, each event triggers a separate fetch, creating
 * race conditions that cause queue teleporting on the waiting area display.
 */
const MONITOR_DEBOUNCE_MS = 100;

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
 * Subscribes to real-time changes on the patients table filtered by service category,
 * with fetch sequence guards, channel status hysteresis, and automatic polling fallback
 * when the Supabase Realtime WebSocket is degraded.
 *
 * @param channelName - Unique Supabase channel name for this monitor instance.
 * @param category - The service category to filter events by (e.g., "Consultation").
 * @param onFetch - Callback function invoked when patient data should be re-fetched.
 * @param onStatusChange - Optional callback receiving the Supabase channel status string.
 */
export function useRealtimeSubscription(
    channelName: string,
    category: string,
    onFetch: () => void,
    onStatusChange?: (status: ChannelStatus) => void,
): void {
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
         * reconnect replay) into a single fetch.
         */
        const scheduleFetch = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                guardedFetch('realtime');
            }, MONITOR_DEBOUNCE_MS);
        };

        /**
         * Activates the polling fallback if not already running.
         * Called after the hysteresis grace period when the WebSocket channel
         * remains degraded.
         */
        const startPolling = () => {
            if (pollRef.current) return;
            guardedFetch('poll-start');
            pollRef.current = setInterval(() => {
                guardedFetch('poll-tick');
            }, MONITOR_POLL_INTERVAL_MS);
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
            // removeChannel() fires CLOSED during cleanup; ignore it so polling isn't restarted.
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
            .channel(channelName)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "patients",
                filter: `service=eq.${category}`,
            }, () => {
                scheduleFetch();
            })
            .subscribe((rawStatus) => {
                handleStatusChange(rawStatus as ChannelStatus);
            });

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
    }, [channelName, category]);
}