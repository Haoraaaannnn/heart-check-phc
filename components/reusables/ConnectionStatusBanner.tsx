/**
 * @file ConnectionStatusBanner.tsx
 * @description Non-intrusive connection and offline sync status banner for staff dashboards.
 *
 * Renders a slim, fixed-top notification strip that alerts staff when:
 * - The browser is completely offline.
 * - The Supabase Realtime channel is degraded or timed out.
 * - Local clinical actions are saved offline in IndexedDB awaiting sync.
 * - The background sync engine is pushing pending offline actions to Supabase.
 * - Reconnection and sync confirmation have completed.
 *
 * Adheres strictly to AGENTS.md rules with centralized texts, full JSDoc, and zero emojis.
 *
 * @module components/reusables/ConnectionStatusBanner
 */

'use client';

import { useEffect, useState } from 'react';
import { ChannelStatus } from '@/hooks/useConnectionStatus';
import { connectionTexts } from '@/constants/connectionTexts';

/**
 * Props for {@link ConnectionStatusBanner}.
 */
export interface ConnectionStatusBannerProps {
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

  /**
   * Number of mutations currently saved to the local outbox awaiting sync.
   * Sourced from `useOfflineQueue().pendingCount`.
   */
  pendingCount?: number;

  /**
   * Whether the offline outbox queue is actively syncing mutations to Supabase.
   * Sourced from `useOfflineQueue().isSyncing`.
   */
  isSyncingQueue?: boolean;

  /**
   * Whether to render the leading status icon.
   * Defaults to true.
   */
  showIcon?: boolean;
}

/**
 * ConnectionStatusBanner component.
 *
 * Displays a fixed-position slim notification bar at the top of the viewport
 * when the connection is degraded or when offline changes are pending/syncing.
 *
 * @param props - See {@link ConnectionStatusBannerProps}.
 * @returns A fixed-position banner element, or null when fully connected and idle.
 */
export function ConnectionStatusBanner({
  isOnline,
  channelStatus,
  isFullyConnected,
  pendingCount = 0,
  isSyncingQueue = false,
  showIcon = true,
}: ConnectionStatusBannerProps) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [wasEverDegraded, setWasEverDegraded] = useState(false);

  useEffect(() => {
    // Only flag as degraded if network is offline, channel has an explicit failure,
    // or there are pending mutations. The normal initial CONNECTING handshake
    // is expected and must not trigger false-positive recovery banners.
    const isDegraded =
      !isOnline ||
      channelStatus === 'TIMED_OUT' ||
      channelStatus === 'CHANNEL_ERROR' ||
      channelStatus === 'CLOSED' ||
      pendingCount > 0;

    if (isDegraded) {
      setWasEverDegraded(true);
    }
  }, [isOnline, channelStatus, pendingCount]);

  useEffect(() => {
    if (isFullyConnected && wasEverDegraded && pendingCount === 0 && !isSyncingQueue) {
      setShowRecovery(true);
      const timer = setTimeout(() => {
        setShowRecovery(false);
        setWasEverDegraded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullyConnected, wasEverDegraded, pendingCount, isSyncingQueue]);

  /**
   * Determine the appropriate label, styling, and icon for the current connection state.
   */
  const getBannerConfig = (): {
    message: string;
    bgColor: string;
    textColor: string;
    iconClass: string;
  } | null => {
    // 1. Active outbox queue synchronization
    if (isSyncingQueue && pendingCount > 0) {
      return {
        message: connectionTexts.syncingQueue(pendingCount),
        bgColor: '#1e3a5f',
        textColor: '#dbeafe',
        iconClass: 'bx bx-loader-circle animate-spin',
      };
    }

    // 2. Offline actions held safely in local storage
    if (pendingCount > 0 && (!isOnline || !isFullyConnected)) {
      const message =
        pendingCount === 1
          ? connectionTexts.offlinePendingSingular
          : connectionTexts.offlinePendingPlural(pendingCount);

      return {
        message,
        bgColor: '#92400e',
        textColor: '#fef3c7',
        iconClass: 'bx bx-data',
      };
    }

    // 3. Reconnection confirmation
    if (isFullyConnected && showRecovery) {
      return {
        message: connectionTexts.liveRestored,
        bgColor: '#166534',
        textColor: '#dcfce7',
        iconClass: 'bx bx-wifi',
      };
    }

    // 4. Normal healthy live state
    if (isFullyConnected && pendingCount === 0) {
      return null;
    }

    // 5. Hard offline (no browser connection)
    if (!isOnline) {
      return {
        message: connectionTexts.noInternet,
        bgColor: '#7f1d1d',
        textColor: '#fee2e2',
        iconClass: 'bx bx-wifi-off',
      };
    }

    // 6. Weak signal or channel errors
    if (channelStatus === 'TIMED_OUT' || channelStatus === 'CHANNEL_ERROR') {
      return {
        message: connectionTexts.weakSignal,
        bgColor: '#92400e',
        textColor: '#fef3c7',
        iconClass: 'bx bx-signal-3',
      };
    }

    // 7. Channel closed
    if (channelStatus === 'CLOSED') {
      return {
        message: connectionTexts.connectionClosed,
        bgColor: '#1e3a5f',
        textColor: '#dbeafe',
        iconClass: 'bx bx-loader-circle',
      };
    }

    if (channelStatus === 'CONNECTING') {
      return null;
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.4rem 1rem',
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontSize: '0.8rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        lineHeight: 1.4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        transition: 'opacity 0.3s ease',
      }}
    >
      {showIcon && (
        <i
          className={config.iconClass}
          style={{ fontSize: '1rem', flexShrink: 0 }}
          aria-hidden="true"
        />
      )}
      <span>{config.message}</span>
    </div>
  );
}

export default ConnectionStatusBanner;
