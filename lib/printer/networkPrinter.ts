/**
 * @fileoverview Server-side Network Socket Driver for Ethernet/Wi-Fi ESC/POS Thermal Printers.
 *
 * Implements direct TCP/IP socket streaming (Standard RAW Port 9100) to network-connected
 * thermal receipt printers (e.g. Epson TM-T82, Xprinter, Rongta).
 *
 * Architectural Features:
 * - Direct TCP communication bypassing operating system drivers or shell subprocesses.
 * - Strict 4-second socket connection and write timeout to protect request threads.
 * - Host IP sanitization and validation to prevent Server-Side Request Forgery (SSRF).
 * - Automatic socket cleanup and buffer flushing on disconnection.
 *
 * @module lib/printer/networkPrinter
 */

import net from 'net';
import { getTimestamp } from '@/lib/logger';

/**
 * Result of a network socket print attempt.
 */
export interface NetworkPrintResult {
  /** Whether the byte stream was successfully accepted by the printer socket. */
  success: boolean;
  /** Operational message or error description. */
  message: string;
  /** Detailed error object or code if failed. */
  error?: string;
}

/**
 * Validates whether an IP address or hostname string is well-formed for local network usage.
 * Rejects link-local metadata ranges (169.254.0.0/16) to protect against Server-Side Request Forgery (SSRF).
 *
 * @param host - Raw host string to validate.
 * @returns True if host is a valid IPv4 address or alphanumeric LAN hostname.
 */
export function isValidPrinterHost(host: unknown): boolean {
  if (typeof host !== 'string' || !host.trim()) {
    return false;
  }
  const clean = host.trim();

  // Block link-local metadata service (e.g. AWS/GCP 169.254.169.254)
  if (clean.startsWith('169.254.')) {
    return false;
  }

  // Standard IPv4 match
  const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  if (ipv4Regex.test(clean)) {
    return true;
  }
  // Standard local hostname (e.g. "printer.local", "pos80-lan")
  const hostRegex = /^[a-zA-Z0-9][-a-zA-Z0-9_.]*[a-zA-Z0-9]$/;
  return hostRegex.test(clean);
}

/**
 * Dispatches an ESC/POS byte buffer to a network thermal printer via TCP socket.
 *
 * @param host - The IP address or local hostname of the network thermal printer.
 * @param buffer - Binary ESC/POS ticket payload.
 * @param port - TCP port number (defaults to 9100 for RAW thermal receipt printing).
 * @param timeoutMs - Connection timeout in milliseconds (defaults to 4000ms).
 * @returns Promise resolving to a structured result indicating success or failure.
 */
export async function sendToNetworkPrinter(
  host: string,
  buffer: Buffer,
  port = 9100,
  timeoutMs = 4000
): Promise<NetworkPrintResult> {
  const cleanHost = (host || '').trim();

  if (!isValidPrinterHost(cleanHost)) {
    return {
      success: false,
      message: `Invalid printer host specified: "${cleanHost}"`,
    };
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isSettled = false;

    const cleanup = () => {
      try {
        socket.removeAllListeners();
        socket.destroy();
      } catch {
        // Ignore cleanup destruction errors
      }
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.write(buffer, (err) => {
        if (err) {
          console.warn(
            '%s [NETWORK PRINTER WRITE ERROR] Failed sending buffer to %s:%d: %s',
            getTimestamp(),
            cleanHost,
            port,
            err.message
          );
          if (!isSettled) {
            isSettled = true;
            cleanup();
            resolve({
              success: false,
              message: `Socket write error: ${err.message}`,
              error: err.message,
            });
          }
          return;
        }

        // Gracefully end socket after successful transmission
        socket.end();
      });
    });

    socket.on('close', () => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        console.log(
          '%s [NETWORK PRINTER SUCCESS] Printed %d bytes to %s:%d',
          getTimestamp(),
          buffer.length,
          cleanHost,
          port
        );
        resolve({
          success: true,
          message: `Ticket successfully transmitted to ${cleanHost}:${port}`,
        });
      }
    });

    socket.on('timeout', () => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        console.warn(
          '%s [NETWORK PRINTER TIMEOUT] Connection to %s:%d timed out after %dms',
          getTimestamp(),
          cleanHost,
          port,
          timeoutMs
        );
        resolve({
          success: false,
          message: `Network printer at ${cleanHost}:${port} unreachable (timeout)`,
          error: 'ETIMEDOUT',
        });
      }
    });

    socket.on('error', (err) => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        console.warn(
          '%s [NETWORK PRINTER ERROR] Socket error on %s:%d: %s',
          getTimestamp(),
          cleanHost,
          port,
          err.message
        );
        resolve({
          success: false,
          message: `Connection failed: ${err.message}`,
          error: err.message,
        });
      }
    });

    try {
      socket.connect(port, cleanHost);
    } catch (connectErr: unknown) {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        const msg = connectErr instanceof Error ? connectErr.message : String(connectErr);
        resolve({
          success: false,
          message: `Failed to initiate socket connection: ${msg}`,
          error: msg,
        });
      }
    }
  });
}
