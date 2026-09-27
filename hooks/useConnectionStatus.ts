/**
 * @file useConnectionStatus.ts
 * @description Shared hook for tracking browser network connectivity and Supabase Realtime channel health.
 *
 * Detects two distinct failure modes:
 * - Browser offline (`navigator.onLine === false`) — complete network loss.
 * - Supabase channel degraded — WiFi is present but signal is too weak to keep the
 *   WebSocket alive. The browser reports online but the Realtime subscription is
 *   dropping or timing out.
 *
 * This hook is the single source of truth for connection state consumed by the
 * `ConnectionStatusBanner` component and the polling fallback logic in each
 * `useRealtimeSubscription` hook.
 *
 * @remarks
 * This was built to address the weak-wireless-signal problem during PHC OPD demos:
 * all devices may be connected to the same WiFi access point, but the access point's
 * uplink to Supabase cloud is intermittent. In that scenario, `navigator.onLine`
 * returns `true` (WiFi is associated) but Supabase WebSocket connections stall or
 * time out because the actual internet signal is too weak.
 *
 * The `channelStatus` field therefore provides a second, more accurate signal:
 * if the Supabase channel is not `SUBSCRIBED`, polling fallback should activate
 * regardless of what `navigator.onLine` reports.
 *
 * @module hooks/useConnectionStatus
 */

"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Supabase Realtime channel connection status values.
 *
 * @remarks
 * Matches the string literals emitted by the Supabase `channel.subscribe(status =>)` callback.
 */
export type ChannelStatus =
    | "SUBSCRIBED"
    | "TIMED_OUT"
    | "CLOSED"
    | "CHANNEL_ERROR"
    | "CONNECTING";

/**
 * Shape of the value returned by `useConnectionStatus`.
 */
export interface ConnectionStatusResult {
    /**
     * Whether the browser reports network connectivity (`navigator.onLine`).
     * Note: this can return `true` even on weak WiFi where the internet
     * uplink is too degraded for Supabase WebSocket connections to survive.
     */
    isOnline: boolean;

    /**
     * The last known status of the Supabase Realtime channel.
     * `SUBSCRIBED` means the WebSocket is alive and receiving events.
     * Any other value means the connection is degraded or lost.
     */
    channelStatus: ChannelStatus;

    /**
     * True when the system is fully connected: browser online AND channel subscribed.
     * Use this as the primary indicator for whether real-time updates are flowing.
     */
    isFullyConnected: boolean;

    /**
     * Setter for channel status — passed into `useRealtimeSubscription` hooks so
     * they can report their channel's health back up to this shared hook.
     *
     * @param status - The status string from the Supabase subscribe callback.
     */
    setChannelStatus: (status: ChannelStatus) => void;
}

/**
 * Tracks browser online/offline state and Supabase channel subscription health.
 *
 * @returns A `ConnectionStatusResult` object exposing connection state and a channel status setter.
 */
export function useConnectionStatus(): ConnectionStatusResult {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== "undefined" ? navigator.onLine : true,
    );
    const [channelStatus, setChannelStatus] = useState<ChannelStatus>("CONNECTING");

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const updateChannelStatus = useCallback((status: ChannelStatus) => {
        setChannelStatus(status);
    }, []);

    const isFullyConnected = isOnline && channelStatus === "SUBSCRIBED";

    return { isOnline, channelStatus, isFullyConnected, setChannelStatus: updateChannelStatus };
}
