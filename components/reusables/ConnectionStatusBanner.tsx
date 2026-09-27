"use client";

/**
 * @file ConnectionStatusBanner.tsx
 * @description Non-intrusive connection status banner for staff-facing dashboards.
 *
 * Renders a slim, fixed-top notification strip that alerts staff when the system's
 * real-time data feed is degraded due to weak WiFi signal or internet connectivity loss.
 *
 * The banner:
 * - Is completely invisible when the connection is healthy (`isFullyConnected === true`).
 * - Appears automatically when the Supabase Realtime WebSocket drops or the browser
 *   goes offline, without interrupting any ongoing workflow.
 * - Shows a distinct state for "no internet" vs "weak signal" (WiFi present but
 *   Supabase WebSocket is stalling) — the two most common failure modes during
 *   PHC OPD demos on shared WiFi.
 * - Confirms reconnection with a brief "Live" confirmation before hiding itself.
 *
 * @remarks
 * This component was specifically designed for the demo scenario where:
 * - All devices (kiosk, monitor, nurse laptop, transfer tablet) are on the same
 *   shared WiFi access point.
 * - The access point's uplink to Supabase cloud has weak or intermittent signal.
 * - `navigator.onLine` returns `true` because the device is associated with WiFi,
 *   but the actual Supabase WebSocket connection is timing out or erroring.
 *
 * Place this component at the top of nurse and transfer page layouts so it appears
 * above all other content without shifting the layout below it (uses `position: fixed`).
 *
 * @module components/reusables/ConnectionStatusBanner
 */

import { useEffect, useState } from "react";
import { ChannelStatus } from "@/hooks/useConnectionStatus";

/**
 * Props for {@link ConnectionStatusBanner}.
 */
interface ConnectionStatusBannerProps {
    /**
     * Whether the browser reports network connectivity.
     * Sourced from `useConnectionStatus().isOnline`.
     */
    isOnline: boolean;

    /**
     * The current Supabase Realtime channel status.
     * Sourced from `useConnectionStatus().channelStatus`.
     */
    channelStatus: ChannelStatus;

    /**
     * Whether both the browser and the Supabase channel are fully connected.
     * Sourced from `useConnectionStatus().isFullyConnected`.
     */
    isFullyConnected: boolean;
}

/**
 * ConnectionStatusBanner component.
 *
 * Displays a fixed-position slim notification bar at the top of the viewport
 * when the real-time connection is degraded. Invisible when fully connected.
 *
 * @param props - See {@link ConnectionStatusBannerProps}.
 * @returns A fixed-position banner element, or null when fully connected and the
 *   reconnection confirmation has completed.
 */
export function ConnectionStatusBanner({
    isOnline,
    channelStatus,
    isFullyConnected,
}: ConnectionStatusBannerProps) {
    /**
     * Whether to show the "Back online" confirmation flash.
     * Set to true on recovery, then clears after 3 seconds.
     */
    const [showRecovery, setShowRecovery] = useState(false);
    const [wasEverDegraded, setWasEverDegraded] = useState(false);

    useEffect(() => {
        if (!isFullyConnected) {
            setWasEverDegraded(true);
        }
    }, [isFullyConnected]);

    useEffect(() => {
        if (isFullyConnected && wasEverDegraded) {
            setShowRecovery(true);
            const timer = setTimeout(() => {
                setShowRecovery(false);
                setWasEverDegraded(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isFullyConnected, wasEverDegraded]);

    /**
     * Determine the appropriate label and color for the current connection state.
     */
    const getBannerConfig = (): {
        message: string;
        bgColor: string;
        textColor: string;
        iconClass: string;
    } | null => {
        if (isFullyConnected && showRecovery) {
            return {
                message: "Live - Real-time updates restored.",
                bgColor: "#166534",
                textColor: "#dcfce7",
                iconClass: "bx bx-wifi",
            };
        }

        if (isFullyConnected) {
            return null;
        }

        if (!isOnline) {
            return {
                message: "No internet connection. Polling every 5 seconds for updates.",
                bgColor: "#7f1d1d",
                textColor: "#fee2e2",
                iconClass: "bx bx-wifi-off",
            };
        }

        if (channelStatus === "TIMED_OUT" || channelStatus === "CHANNEL_ERROR") {
            return {
                message: "Weak signal - Real-time paused. Polling every 5 seconds. Queue data may be slightly delayed.",
                bgColor: "#92400e",
                textColor: "#fef3c7",
                iconClass: "bx bx-signal-3",
            };
        }

        if (channelStatus === "CLOSED") {
            return {
                message: "Connection closed. Reconnecting and polling for updates...",
                bgColor: "#1e3a5f",
                textColor: "#dbeafe",
                iconClass: "bx bx-loader-circle",
            };
        }

        if (channelStatus === "CONNECTING") {
            return null; // Suppress during initial load
        }

        return null;
    };

    const config = getBannerConfig();

    if (!config) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={config.message}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.4rem 1rem",
                backgroundColor: config.bgColor,
                color: config.textColor,
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: "0.01em",
                lineHeight: 1.4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                transition: "opacity 0.3s ease",
            }}
        >
            <i
                className={config.iconClass}
                style={{ fontSize: "1rem", flexShrink: 0 }}
                aria-hidden="true"
            />
            <span>{config.message}</span>
        </div>
    );
}

export default ConnectionStatusBanner;
