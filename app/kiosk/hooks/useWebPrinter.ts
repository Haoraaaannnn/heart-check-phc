/**
 * @fileoverview React Hook for Browser-based WebUSB and Web Serial Thermal Printing.
 *
 * Provides reactive hardware state, auto-detection on mount, hot-plug listener registration,
 * and high-level pairing/print triggers for kiosk touchscreen terminals.
 *
 * @module app/kiosk/hooks/useWebPrinter
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { PrinterStatus } from '@/lib/printer/types';
import {
  getClientPrinterStatus,
  pairUsbPrinter,
  pairSerialPrinter,
  printViaConnectedWebPrinter,
  registerUsbPlugListeners,
  isWebUsbSupported,
  isWebSerialSupported,
} from '@/lib/printer/webPrinter';
import { getTimestamp } from '@/lib/logger';

/**
 * Hook return contract for {@link useWebPrinter}.
 */
export interface UseWebPrinterReturn {
  /** Current hardware connection and capability status. */
  status: PrinterStatus;
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
  /** Manually re-checks connected hardware peripherals. */
  refreshStatus: () => Promise<void>;
}

/**
 * Reactive hook managing thermal printer auto-detection and browser pairing.
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

  const [isPairing, setIsPairing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Probes current peripheral connectivity.
   */
  const refreshStatus = useCallback(async () => {
    try {
      const current = await getClientPrinterStatus();
      setStatus(current);
      if (current.connected) {
        setError(null);
      }
    } catch (err: unknown) {
      console.warn(`${getTimestamp()} [WEB PRINTER REFRESH ERROR]`, err);
    }
  }, []);

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
  }, [refreshStatus]);

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
    isPairing,
    error,
    pairUsb,
    pairSerial,
    printEscPos,
    refreshStatus,
  };
}
