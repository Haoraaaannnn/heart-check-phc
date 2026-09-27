/**
 * @file useRealtimeSubscription.ts
 * @description Dual-mode Supabase Realtime subscription with automatic polling fallback for the Nurse Dashboard.
 *
 * Operates in two modes:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    and triggers a debounced re-fetch. Zero polling overhead when the channel is healthy.
 * 2. Polling fallback (automatic): When the WebSocket channel drops, times out, or errors
 *    (common on weak WiFi during PHC OPD demos), the hook automatically activates a
 *    5-second polling interval so queue data remains current even without a live WebSocket.
 *
 * The fallback activates and deactivates transparently — staff see no interruption
 * in functionality, only the `ConnectionStatusBanner` indicates the degraded state.
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
 * Subscribes to real-time changes on the patients table with debounce and automatic
 * polling fallback when the Supabase Realtime WebSocket is degraded.
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

    // Keep latest callbacks without re-triggering the subscription effect.
    useEffect(() => {
        onFetchRef.current = onFetch;
    }, [onFetch]);

    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
    }, [onStatusChange]);

    useEffect(() => {
        /**
         * Triggers a debounced fetch from the real-time event handler.
         * Coalesces rapid batch inserts/updates into a single re-fetch.
         */
        const handleUpdate = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onFetchRef.current();
            }, debounceMs);
        };

        /**
         * Activates the polling fallback if not already running.
         * Called when the WebSocket channel is not `SUBSCRIBED`.
         */
        const startPolling = () => {
            if (pollRef.current) return;
            // Trigger an immediate fetch so data is refreshed right when fallback activates.
            onFetchRef.current();
            pollRef.current = setInterval(() => {
                onFetchRef.current();
            }, NURSE_POLL_INTERVAL_MS);
        };

        /**
         * Deactivates the polling fallback. Called when the WebSocket recovers.
         */
        const stopPolling = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
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
                const status = rawStatus as ChannelStatus;
                onStatusChangeRef.current?.(status);

                if (status === "SUBSCRIBED") {
                    stopPolling();
                } else {
                    // Channel is degraded (TIMED_OUT, CHANNEL_ERROR, CLOSED, etc.)
                    startPolling();
                }
            });

        // Browser online/offline events — trigger an immediate fetch on recovery.
        const handleOnline = () => {
            onFetchRef.current();
        };

        window.addEventListener("online", handleOnline);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            stopPolling();
            window.removeEventListener("online", handleOnline);
            void supabase.removeChannel(channel);
        };
    }, [debounceMs]);
}

export default useRealtimeSubscription;