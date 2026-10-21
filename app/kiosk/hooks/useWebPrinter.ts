/**
 * @fileoverview React Hook for Browser-based WebUSB, Web Serial, and Network Thermal Printing.
 *
 * Provides reactive hardware state, real-time hardware status detection (out of paper,
 * paper jam, cover open, printer offline, not detected), auto-detection on mount,
 * hot-plug listener registration, and high-level pairing/print triggers for kiosk
 * touchscreen terminals and superadmin configuration.
 *
 * @module app/kiosk/hooks/useWebPrinter
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { PrinterStatus, PrinterHardwareStatus } from '@/lib/printer/types';
import {
  getClientPrinterStatus,
  getClientPrinterHardwareStatus,
  pairUsbPrinter,
  pairSerialPrinter,
  printViaConnectedWebPrinter,
  registerUsbPlugListeners,
  isWebUsbSupported,
  isWebSerialSupported,
} from '@/lib/printer/webPrinter';
import { buildHardwareStatus } from '@/lib/printer/statusParser';
import { getTimestamp } from '@/lib/logger';

/**
 * Hook return contract for {@link useWebPrinter}.
 */
export interface UseWebPrinterReturn {
  /** Current connection summary status. */
  status: PrinterStatus;
  /** Detailed telemetry state of the thermal printer hardware mechanism. */
  hardwareStatus: PrinterHardwareStatus;
  /** Whether pairing dialog is currently open or awaiting user gesture. */
  isPairing: boolean;
  /** Error message if pairing or printing failed. */
  error: string | null;
  /** Initiates the browser's native USB pairing modal. */
  pairUsb: () => Promise<boolean>;
  /** Initiates the browser's native Serial port pairing modal. */
  pairSerial: () => Promise<boolean>;
  /** Dispatches an ESC/POS base64 payload to the active local printer. */
  printEscPos: (base64Payload: string) => Promise<{ success: boolean; message?: string }>;
  /** Manually re-checks connected hardware peripherals and server status. */
  refreshStatus: () => Promise<void>;
  /** Probes and resolves composite client + server hardware status. */
  refreshHardwareStatus: () => Promise<PrinterHardwareStatus>;
}

/**
 * Reactive hook managing thermal printer auto-detection, hardware telemetry, and browser pairing.
 *
 * @returns {@link UseWebPrinterReturn} reactive state and action handlers.
 */
export function useWebPrinter(): UseWebPrinterReturn {
  const [status, setStatus] = useState<PrinterStatus>({
    connected: false,
    type: 'none',
    name: 'Detecting...',
    details: 'Scanning for attached hardware',
    isSupported: true,
  });

  const [hardwareStatus, setHardwareStatus] = useState<PrinterHardwareStatus>(
    buildHardwareStatus(
      'not_detected',
      'none',
      'Detecting...',
      'Probing printer hardware status'
    )
  );

  const [isPairing, setIsPairing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Resolves composite hardware status across client-side WebUSB/Serial and server-side network/device.
   */
  const refreshHardwareStatus = useCallback(async (): Promise<PrinterHardwareStatus> => {
    try {
      // 1. Probe client-side WebUSB / Serial hardware first
      const clientHw = await getClientPrinterHardwareStatus();
      if (clientHw.condition !== 'not_detected') {
        setHardwareStatus(clientHw);
        return clientHw;
      }

      // 2. Fallback: Probe server-side printer status (Network IP socket or /dev/usb/lp*)
      const serverRes = await fetch('/api/print-ticket', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);

      if (serverRes && serverRes.ok) {
        const serverData = await serverRes.json().catch(() => null);
        if (serverData?.status) {
          const sHw = serverData.status as PrinterHardwareStatus;
          setHardwareStatus(sHw);
          return sHw;
        }
      }

      setHardwareStatus(clientHw);
      return clientHw;
    } catch (err: unknown) {
      console.warn(`${getTimestamp()} [WEB PRINTER HW REFRESH ERROR]`, err);
      const fallback = buildHardwareStatus(
        'not_detected',
        'none',
        'Status Probe Failed',
        err instanceof Error ? err.message : String(err)
      );
      setHardwareStatus(fallback);
      return fallback;
    }
  }, []);

  /**
   * Probes current peripheral connectivity and hardware telemetry.
   */
  const refreshStatus = useCallback(async () => {
    try {
      const current = await getClientPrinterStatus();
      setStatus(current);
      if (current.connected) {
        setError(null);
      }
      await refreshHardwareStatus();
    } catch (err: unknown) {
      console.warn(`${getTimestamp()} [WEB PRINTER REFRESH ERROR]`, err);
    }
  }, [refreshHardwareStatus]);

  // Auto-detect and register hot-plug listeners on mount
  useEffect(() => {
    const isSupported = isWebUsbSupported() || isWebSerialSupported();
    if (!isSupported) {
      setStatus({
        connected: false,
        type: 'none',
        name: 'WebUSB Unsupported',
        details: 'Use Google Chrome or Microsoft Edge for USB thermal printing.',
        isSupported: false,
      });
      refreshHardwareStatus();
      return;
    }

    refreshStatus();

    // Hot-plug connection listener
    const unregister = registerUsbPlugListeners(
      (device) => {
        console.log(`${getTimestamp()} [USB HOTPLUG] Attached:`, device.productName);
        refreshStatus();
      },
      () => {
        console.log(`${getTimestamp()} [USB HOTPLUG] Detached`);
        refreshStatus();
      }
    );

    return () => {
      unregister();
    };
  }, [refreshStatus, refreshHardwareStatus]);

  /**
   * Prompts the browser's USB device pairing dialogue.
   */
  const pairUsb = useCallback(async (): Promise<boolean> => {
    setIsPairing(true);
    setError(null);
    try {
      const device = await pairUsbPrinter();
      if (device) {
        await refreshStatus();
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return false;
    } finally {
      setIsPairing(false);
    }
  }, [refreshStatus]);

  /**
   * Prompts the browser's Serial port pairing dialogue.
   */
  const pairSerial = useCallback(async (): Promise<boolean> => {
    setIsPairing(true);
    setError(null);
    try {
      const port = await pairSerialPrinter();
      if (port) {
        await refreshStatus();
        return true;
      }
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return false;
    } finally {
      setIsPairing(false);
    }
  }, [refreshStatus]);

  /**
   * Dispatches an ESC/POS base64 payload to the active local printer.
   */
  const printEscPos = useCallback(
    async (base64Payload: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const result = await printViaConnectedWebPrinter(base64Payload);
        return {
          success: result.success,
          message: result.message,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          message: msg,
        };
      }
    },
    []
  );

  return {
    status,
    hardwareStatus,
    isPairing,
    error,
    pairUsb,
    pairSerial,
    printEscPos,
    refreshStatus,
    refreshHardwareStatus,
  };
}
