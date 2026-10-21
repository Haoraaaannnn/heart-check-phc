/**
 * @fileoverview ESC/POS Thermal Printer Hardware Status Parser & Telemetry Helper.
 *
 * Implements standard ESC/POS real-time status transmission commands (DLE EOT n)
 * and bitwise telemetry parsing for thermal receipt printers across WebUSB, WebSerial,
 * Network TCP sockets, and Linux device nodes.
 *
 * Real-Time ESC/POS Commands:
 * - DLE EOT 1 (0x10 0x04 0x01): Transmit printer status (online/offline).
 * - DLE EOT 2 (0x10 0x04 0x02): Transmit offline status (cover open, feed button, error).
 * - DLE EOT 3 (0x10 0x04 0x03): Transmit error status (paper jam / auto-cutter error).
 * - DLE EOT 4 (0x10 0x04 0x04): Transmit paper roll sensor status (paper low, paper empty).
 *
 * @module lib/printer/statusParser
 */

import { PrinterHardwareCondition, PrinterHardwareStatus, PrinterConnectionType } from './types';

/**
 * Standard real-time status transmission byte sequence (DLE EOT 1 through 4).
 * Query length: 12 bytes (4 separate 3-byte commands).
 */
export const ESC_POS_STATUS_QUERY = new Uint8Array([
  0x10, 0x04, 0x01, // DLE EOT 1: Printer Status
  0x10, 0x04, 0x02, // DLE EOT 2: Offline Status
  0x10, 0x04, 0x03, // DLE EOT 3: Error Status
  0x10, 0x04, 0x04, // DLE EOT 4: Continuous Paper Sensor Status
]);

/**
 * Returns bilingual English and Filipino telemetry messages for a given hardware condition.
 *
 * @param condition - The evaluated printer condition.
 * @returns Object with English (`en`) and Filipino (`fil`) message strings.
 */
export function getStatusMessage(condition: PrinterHardwareCondition): { en: string; fil: string } {
  switch (condition) {
    case 'ready':
      return {
        en: 'Printer is ready and operational.',
        fil: 'Handa at maayos ang printer.',
      };
    case 'out_of_paper':
      return {
        en: 'Thermal printer is out of paper. On-screen and SMS ticket provided.',
        fil: 'Naubusan ng papel ang printer. Digital at SMS ticket ang ibibigay.',
      };
    case 'paper_jam':
      return {
        en: 'Thermal printer paper jam detected. On-screen and SMS ticket provided.',
        fil: 'May bara sa papel ang printer. Digital at SMS ticket ang ibibigay.',
      };
    case 'cover_open':
      return {
        en: 'Thermal printer cover is open. On-screen and SMS ticket provided.',
        fil: 'Bukas ang takip ng printer. Digital at SMS ticket ang ibibigay.',
      };
    case 'offline':
      return {
        en: 'Thermal printer is offline or disconnected. On-screen and SMS ticket provided.',
        fil: 'Offline o hindi nakakabit ang printer. Digital at SMS ticket ang ibibigay.',
      };
    case 'not_detected':
    default:
      return {
        en: 'No thermal printer detected. On-screen and SMS ticket provided.',
        fil: 'Walang nakitang printer. Digital at SMS ticket ang ibibigay.',
      };
  }
}

/**
 * Diagnostic outcome of parsing raw ESC/POS status bytes.
 */
export interface ParsedEscPosStatus {
  condition: PrinterHardwareCondition;
  paperLow: boolean;
  coverOpen: boolean;
  paperOut: boolean;
  paperJam: boolean;
  offline: boolean;
  rawHex: string;
}

/**
 * Parses raw status bytes returned by a thermal printer in response to DLE EOT commands.
 *
 * @param bytes - Buffer or Uint8Array of bytes returned from the printer.
 * @returns {@link ParsedEscPosStatus} parsed status flags and condition.
 */
export function parseEscPosStatusBytes(bytes: Uint8Array | Buffer): ParsedEscPosStatus {
  if (!bytes || bytes.length === 0) {
    return {
      condition: 'offline',
      paperLow: false,
      coverOpen: false,
      paperOut: false,
      paperJam: false,
      offline: true,
      rawHex: '',
    };
  }

  const rawHex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  let coverOpen = false;
  let paperOut = false;
  let paperJam = false;
  let offline = false;
  let paperLow = false;

  // If 4 response bytes are returned (one per DLE EOT n)
  if (bytes.length >= 4) {
    const b1 = bytes[0]; // DLE EOT 1
    const b2 = bytes[1]; // DLE EOT 2
    const b3 = bytes[2]; // DLE EOT 3
    const b4 = bytes[3]; // DLE EOT 4

    // DLE EOT 1: bit 3 is 1 if offline
    if ((b1 & 0x08) !== 0) {
      offline = true;
    }

    // DLE EOT 2: bit 2 is 1 if cover open; bit 5 is 1 if paper end stop
    if ((b2 & 0x04) !== 0) {
      coverOpen = true;
    }
    if ((b2 & 0x20) !== 0) {
      paperOut = true;
    }

    // DLE EOT 3: bit 3 is 1 if auto-cutter error (paper jam)
    if ((b3 & 0x08) !== 0) {
      paperJam = true;
    }

    // DLE EOT 4: bit 2,3 (0x0C) near-end empty; bit 5,6 (0x60 or 0x20) roll empty
    if ((b4 & 0x0c) !== 0) {
      paperLow = true;
    }
    if ((b4 & 0x60) !== 0 || (b4 & 0x20) !== 0) {
      paperOut = true;
    }
  } else if (bytes.length === 1) {
    // Single byte status evaluation (e.g. GS r 1 or DLE EOT 1)
    const b = bytes[0];
    if ((b & 0x08) !== 0) offline = true;
    if ((b & 0x60) !== 0 || (b & 0x20) !== 0) paperOut = true;
    if ((b & 0x0c) !== 0) paperLow = true;
    if ((b & 0x04) !== 0) coverOpen = true;
  }

  // Determine primary condition based on severity hierarchy
  let condition: PrinterHardwareCondition = 'ready';

  if (coverOpen) {
    condition = 'cover_open';
  } else if (paperJam) {
    condition = 'paper_jam';
  } else if (paperOut) {
    condition = 'out_of_paper';
  } else if (offline) {
    condition = 'offline';
  } else {
    condition = 'ready';
  }

  return {
    condition,
    paperLow,
    coverOpen,
    paperOut,
    paperJam,
    offline,
    rawHex,
  };
}

/**
 * Builds a standardized {@link PrinterHardwareStatus} object.
 *
 * @param condition - The hardware condition code.
 * @param connectionType - The connection method.
 * @param name - The device or host name.
 * @param details - Optional technical details.
 * @param paperLow - Optional warning that paper roll is running out.
 * @returns Fully formatted {@link PrinterHardwareStatus} instance.
 */
export function buildHardwareStatus(
  condition: PrinterHardwareCondition,
  connectionType: PrinterConnectionType,
  name: string,
  details?: string,
  paperLow = false
): PrinterHardwareStatus {
  const isReady = condition === 'ready';
  const canPrintPhysical = condition === 'ready';
  const { en, fil } = getStatusMessage(condition);

  return {
    condition,
    isReady,
    canPrintPhysical,
    connectionType,
    name,
    details,
    paperLow,
    checkedAt: new Date().toISOString(),
    message: en,
    messageFil: fil,
  };
}
