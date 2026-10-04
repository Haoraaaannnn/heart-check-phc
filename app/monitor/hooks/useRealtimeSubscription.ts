/**
 * @file useRealtimeSubscription.ts
 * @description Dual-mode Supabase Realtime subscription with automatic polling fallback for the Monitor Display.
 *
 * Operates in two modes:
 * 1. Real-time mode (primary): Supabase WebSocket channel receives `postgres_changes` events
 *    filtered by service category and immediately triggers a re-fetch.
 * 2. Polling fallback (automatic): When the WebSocket drops or times out (common on
 *    weak WiFi during PHC OPD demos), an 8-second polling interval keeps the waiting
 *    area display refreshed without a live WebSocket.
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
 * Subscribes to real-time changes on the patients table filtered by service category,
 * with automatic polling fallback when the Supabase Realtime WebSocket is degraded.
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
            onFetchRef.current(); // Immediate fetch on fallback activation
            pollRef.current = setInterval(() => {
                onFetchRef.current();
            }, MONITOR_POLL_INTERVAL_MS);
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
            .channel(channelName)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "patients",
                filter: `service=eq.${category}`,
            }, () => {
                onFetchRef.current();
            })
            .subscribe((rawStatus) => {
                const status = rawStatus as ChannelStatus;
                onStatusChangeRef.current?.(status);

                if (status === "SUBSCRIBED") {
                    stopPolling();
                } else {
                    startPolling();
                }
            });

        const handleOnline = () => {
            onFetchRef.current();
        };

        window.addEventListener("online", handleOnline);

        return () => {
            stopPolling();
            window.removeEventListener("online", handleOnline);
            void supabase.removeChannel(channel);
        };
    }, [channelName, category]);
}