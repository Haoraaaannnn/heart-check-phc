/**
 * @fileoverview React Hook for SuperAdmin monitoring of active Kiosk Terminals and hardware health.
 *
 * Subscribes to the Supabase Realtime presence channel `phc-kiosks-presence` to track
 * live touchscreen terminals, active screen locations, and printer peripheral status.
 *
 * @module app/superadmin/customization/hooks/useKioskPresenceMonitor
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KioskPresencePayload } from '@/types/kioskPresence';

const PRESENCE_CHANNEL_NAME = 'phc-kiosks-presence';

/**
 * Hook return contract for {@link useKioskPresenceMonitor}.
 */
export interface UseKioskPresenceMonitorReturn {
  /** Array of all currently detected and active kiosk terminal sessions. */
  kiosks: KioskPresencePayload[];
  /** Total number of opened kiosk terminals. */
  totalKiosks: number;
  /** Number of terminals actively communicating or ready. */
  activeCount: number;
  /** Number of terminals with verified operational thermal receipt printers. */
  readyPrintersCount: number;
  /** Whether the presence channel is establishing its initial connection. */
  loading: boolean;
  /** Manually requests an immediate presence sync. */
  refresh: () => void;
}

/**
 * Reactive hook providing real-time kiosk terminal presence telemetry to SuperAdmin.
 *
 * @returns {@link UseKioskPresenceMonitorReturn} aggregated kiosk telemetry.
 */
export function useKioskPresenceMonitor(): UseKioskPresenceMonitorReturn {
  const supabase = useMemo(() => createClient(), []);
  const [kiosks, setKiosks] = useState<KioskPresencePayload[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const syncPresence = useCallback((presenceState: Record<string, unknown[]>) => {
    const list: KioskPresencePayload[] = [];

    for (const key of Object.keys(presenceState)) {
      const records = presenceState[key];
      if (Array.isArray(records) && records.length > 0) {
        // Pick the most recent record for this key
        const latest = records[records.length - 1] as unknown;
        if (
          latest &&
          typeof latest === 'object' &&
          'kioskId' in latest &&
          'hardware' in latest
        ) {
          list.push(latest as KioskPresencePayload);
        }
      }
    }

    // Sort by openedAt ascending or kioskName
    list.sort((a, b) => a.kioskName.localeCompare(b.kioskName));
    setKiosks(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);

    const channel = supabase.channel(PRESENCE_CHANNEL_NAME);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        syncPresence(state);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        syncPresence(state);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        syncPresence(state);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          const state = channel.presenceState();
          syncPresence(state);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, syncPresence]);

  const totalKiosks = kiosks.length;
  const activeCount = kiosks.filter((k) => k.status !== 'idle').length;
  const readyPrintersCount = kiosks.filter((k) => k.hardware.printerReady).length;

  const refresh = useCallback(() => {
    // No-op placeholder, presence is reactive
  }, []);

  return {
    kiosks,
    totalKiosks,
    activeCount,
    readyPrintersCount,
    loading,
    refresh,
  };
}
