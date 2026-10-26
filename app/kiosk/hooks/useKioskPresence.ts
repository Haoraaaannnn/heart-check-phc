/**
 * @fileoverview React Hook for broadcasting real-time Kiosk Terminal presence and hardware status.
 *
 * Broadcasts heartbeat telemetry, active screen navigation, and connected receipt printer
 * hardware state across physical touchscreens to the SuperAdmin management console.
 *
 * @module app/kiosk/hooks/useKioskPresence
 */

'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useWebPrinter } from '@/app/kiosk/hooks/useWebPrinter';
import { KioskPresencePayload, KioskHardwareStatus } from '@/types/kioskPresence';

const PRESENCE_CHANNEL_NAME = 'phc-kiosks-presence';
const HEARTBEAT_INTERVAL_MS = 15000;
const IDLE_THRESHOLD_MS = 45000;

const SESSION_KIOSK_ID_KEY = 'phc_kiosk_session_id';
const LOCAL_KIOSK_NAME_KEY = 'phc_kiosk_terminal_name';
const LOCAL_NETWORK_PRINTER_IP_KEY = 'phc_network_printer_ip';

/**
 * Resolves a human-friendly display label for a kiosk pathname.
 *
 * @param path - Active route pathname.
 * @returns Human-readable screen title.
 */
function resolveScreenTitle(path: string): string {
  if (path === '/kiosk' || path === '/kiosk/') return 'Welcome / Slideshow';
  if (path.includes('kiosk-new-old-selection')) return 'Patient Type Selection';
  if (path.includes('kiosk-services')) return 'Service Selection';
  if (path.includes('category-selection')) return 'Category Selection';
  if (path.includes('kiosk-cubicle-selection')) return 'Cubicle Selection';
  if (path.includes('sms-input')) return 'Mobile Number Entry';
  if (path.includes('queue-print')) return 'Ticket Dispensing';
  return 'Touchscreen Terminal';
}

/**
 * Generates or retrieves a persistent session ID for the current kiosk tab.
 *
 * @returns Stable terminal session ID.
 */
function getOrCreateKioskId(): string {
  if (typeof window === 'undefined') return 'kiosk-init';

  const existingId = sessionStorage.getItem(SESSION_KIOSK_ID_KEY);
  if (existingId) return existingId;

  const generatedId = `kiosk-${Math.random().toString(36).substring(2, 8)}`;
  sessionStorage.setItem(SESSION_KIOSK_ID_KEY, generatedId);
  return generatedId;
}

/**
 * Hook broadcasting real-time kiosk presence and printer telemetry via Supabase Realtime.
 */
export function useKioskPresence(): void {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const { status: printerStatus, hardwareStatus } = useWebPrinter();

  const kioskIdRef = useRef<string>('');
  const openedAtRef = useRef<string>('');
  const lastActivityTimeRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    kioskIdRef.current = getOrCreateKioskId();
    openedAtRef.current = new Date().toISOString();
    lastActivityTimeRef.current = Date.now();
  }, []);

  /**
   * Resolves current hardware status composite across WebUSB and Network settings.
   */
  const resolveHardwareStatus = useCallback((): KioskHardwareStatus => {
    let networkIp = '';
    if (typeof window !== 'undefined') {
      networkIp = localStorage.getItem(LOCAL_NETWORK_PRINTER_IP_KEY) || '';
    }

    if (printerStatus.connected) {
      return {
        printerReady: true,
        printerType: printerStatus.type === 'webserial' ? 'webserial' : 'webusb',
        printerDetails: printerStatus.name || 'Direct USB Thermal Printer',
        paperStatus: hardwareStatus.paperLow
          ? 'low'
          : hardwareStatus.condition === 'out_of_paper'
          ? 'unknown'
          : 'ok',
      };
    }

    if (networkIp.trim()) {
      return {
        printerReady: true,
        printerType: 'network',
        printerDetails: `Network Printer (${networkIp.trim()}:9100)`,
        paperStatus: 'ok',
      };
    }

    return {
      printerReady: false,
      printerType: 'none',
      printerDetails: 'No Printer Configured',
      paperStatus: 'unknown',
    };
  }, [printerStatus, hardwareStatus]);

  /**
   * Builds the current snapshot payload for presence broadcast.
   */
  const buildPayload = useCallback((): KioskPresencePayload => {
    const isPrinting = pathname.includes('queue-print');
    const idleElapsedMs = Date.now() - lastActivityTimeRef.current;
    const isIdle = !isPrinting && idleElapsedMs > IDLE_THRESHOLD_MS;

    let computedStatus: KioskPresencePayload['status'] = 'online';
    if (isPrinting) {
      computedStatus = 'printing';
    } else if (isIdle) {
      computedStatus = 'idle';
    } else {
      computedStatus = 'active';
    }

    let terminalName = `Terminal ${kioskIdRef.current.replace('kiosk-', '#')}`;
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem(LOCAL_KIOSK_NAME_KEY);
      if (storedName && storedName.trim()) {
        terminalName = storedName.trim();
      }
    }

    const resolution =
      typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : '1920x1080';

    return {
      kioskId: kioskIdRef.current,
      kioskName: terminalName,
      currentPath: pathname,
      currentScreenTitle: resolveScreenTitle(pathname),
      status: computedStatus,
      hardware: resolveHardwareStatus(),
      openedAt: openedAtRef.current,
      lastSeen: new Date().toISOString(),
      screenResolution: resolution,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }, [pathname, resolveHardwareStatus]);

  // Track touch / mouse activity for idle state detection
  useEffect(() => {
    function handleUserActivity() {
      lastActivityTimeRef.current = Date.now();
    }

    window.addEventListener('pointerdown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, []);

  // Initialize and maintain Supabase presence subscription
  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL_NAME, {
      config: {
        presence: {
          key: kioskIdRef.current,
        },
      },
    });

    channelRef.current = channel;

    channel.subscribe(async (subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        const payload = buildPayload();
        await channel.track(payload);
      }
    });

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabase, buildPayload]);

  // Update presence on path change, printer status changes, or periodic heartbeat
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    // Send immediate update upon state changes
    const payload = buildPayload();
    channel.track(payload).catch(() => {});

    // Periodic heartbeat
    const intervalTimer = setInterval(() => {
      const freshPayload = buildPayload();
      channel.track(freshPayload).catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalTimer);
    };
  }, [buildPayload]);
}
