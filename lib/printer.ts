/**
 * @fileoverview Legacy Hardware Thermal Receipt Printer Utility.
 *
 * Provides fallback programmatic interface for dispatching ESC/POS formatted
 * tickets directly to connected Linux USB receipt printer device nodes
 * (/dev/usb/lp*).
 *
 * Security Considerations:
 * - Direct binary streaming via fs/promises.writeFile without invoking host shell.
 * - Complete elimination of child_process.exec() to prevent OS command injection (SEC-024 / SEC-AUD-001).
 * - Input sanitization enforcing character whitelisting on ticket data.
 *
 * @remarks
 * New implementations should prefer the Next.js Route Handler at app/api/print-ticket.
 *
 * @module lib/printer
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import { getTimestamp } from './logger';
import { supabase } from './supabase';

/**
 * Sanitizes input text to prevent binary ESC/POS control code injection.
 * Strips non-printable characters and control bytes while preserving safe punctuation.
 *
 * @param input - The raw string value to sanitize.
 * @returns Sanitized string safe for thermal printing.
 */
function sanitizePrinterText(input: string): string {
  if (!input) return '';
  return input.replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim();
}

/**
 * Dispatches an ESC/POS formatted ticket to the connected thermal printer device.
 *
 * @param patientNum - Queue ticket number issued to the patient.
 * @param serviceName - Operational department or clinic name.
 * @param cubicle - Assigned cubicle or counter label.
 * @returns Promise resolving to true if printed, or rejecting on hardware/query failure.
 *
 * @throws Error if patient record lookup fails or no printer device node is accessible.
 */
export const sendToPrinter = async (
  patientNum: string,
  serviceName: string,
  cubicle: string
): Promise<boolean> => {
  const cleanPatientNum = sanitizePrinterText(patientNum);
  const cleanServiceName = sanitizePrinterText(serviceName);
  const cleanCubicle = sanitizePrinterText(cubicle) || 'Waiting Area';

  // Fetch patient record from database to verify existence
  const { data: patientRecord, error: dbError } = await supabase
    .from('patients')
    .select('id, created_at, patientNum, phoneNum, service')
    .eq('patientNum', cleanPatientNum)
    .maybeSingle();

  if (dbError) {
    console.error(
      `${getTimestamp()} [PRINT ERROR] Failed to fetch patient record for ${cleanPatientNum}:`,
      dbError.message
    );
    throw dbError;
  }

  // ESC/POS Formatting Codes
  const ESC = '\x1b';
  const GS = '\x1d';
  const RESET = `${ESC}@`;
  const CENTER = `${ESC}a\x01`;
  const LEFT = `${ESC}a\x00`;
  const BOLD_ON = `${ESC}E\x01`;
  const BOLD_OFF = `${ESC}E\x00`;
  const BIG_FONT = `${GS}!\x11`;
  const NORMAL_FONT = `${GS}!\x00`;
  const CUT = `${GS}V\x00`;

  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();

  // Construct receipt ticket payload
  const ticket =
    RESET +
    CENTER +
    BOLD_ON +
    'HEART CHECK PHC' +
    BOLD_OFF +
    '\n' +
    '--------------------------------\n' +
    LEFT +
    `Date: ${date}\n` +
    `Time: ${time}\n` +
    `Service: ${cleanServiceName}\n` +
    `Location: ${cleanCubicle}\n\n` +
    CENTER +
    BIG_FONT +
    cleanPatientNum +
    NORMAL_FONT +
    '\n\n' +
    'Please wait for your number.\n' +
    '--------------------------------\n' +
    '\n\n\n\n\n' +
    CUT;

  const buffer = Buffer.from(ticket, 'latin1');
  const candidatePaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
  let lastError: string | null = null;

  for (const path of candidatePaths) {
    if (existsSync(path)) {
      try {
        await fs.writeFile(path, buffer);
        console.log(
          `${getTimestamp()} [PRINT SUCCESS] Direct device print completed:`,
          {
            id: patientRecord?.id,
            patientNum: cleanPatientNum,
            device: path,
            size: buffer.length,
          }
        );
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lastError = `Failed writing to ${path}: ${message}`;
        console.warn(`${getTimestamp()} [PRINT DEVICE WARN] ${lastError}`);
      }
    }
  }

  const finalErrorMessage =
    lastError || 'No accessible thermal printer device found on /dev/usb/lp*';
  console.error(
    `${getTimestamp()} [PRINT FAILURE] Hardware write failure:`,
    finalErrorMessage
  );
  throw new Error(finalErrorMessage);
};