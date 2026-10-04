/**
 * @file useRealtimeSubscription.ts
 * @description Dual-mode Supabase Realtime subscription with automatic polling fallback for the Transfer Dashboard.
 *
 * Operates in two modes:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    and immediately triggers a re-fetch. No polling overhead when the channel is healthy.
 * 2. Polling fallback (automatic): When the WebSocket channel drops, times out, or errors
 *    (common on weak WiFi during PHC OPD demos), the hook activates a 5-second polling
 *    interval so the transfer queue stays current without a live WebSocket.
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
 * Subscribes to real-time changes on the patients table with automatic polling
 * fallback when the Supabase Realtime WebSocket is degraded.
 *
 * @param onFetch - Callback function invoked when patient data should be re-fetched.
 * @param onStatusChange - Optional callback receiving the raw Supabase channel status string,
 *   used by the parent page to update `ConnectionStatusBanner` state.
 */
export function useRealtimeSubscription(
    onFetch: () => void,
    onStatusChange?: (status: ChannelStatus) => void,
): void {
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
         * Activates the polling fallback if not already running.
         */
        const startPolling = () => {
            if (pollRef.current) return;
            // Immediate fetch so data is refreshed right when fallback activates.
            onFetchRef.current();
            pollRef.current = setInterval(() => {
                onFetchRef.current();
            }, TRANSFER_POLL_INTERVAL_MS);
        };

        /**
         * Deactivates the polling fallback when the WebSocket recovers.
         */
        const stopPolling = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        const channel = supabase
            .channel("patients-queue")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "patients" },
                () => {
                    onFetchRef.current();
                },
            )
            .subscribe((rawStatus) => {
                const status = rawStatus as ChannelStatus;
                onStatusChangeRef.current?.(status);

                if (status === "SUBSCRIBED") {
                    stopPolling();
                } else {
                    startPolling();
                }
            });

        // Trigger an immediate fresh fetch when internet recovers.
        const handleOnline = () => {
            onFetchRef.current();
        };

        window.addEventListener("online", handleOnline);

        return () => {
            stopPolling();
            window.removeEventListener("online", handleOnline);
            void supabase.removeChannel(channel);
        };
    }, []);
}