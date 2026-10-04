/**
 * @fileoverview Hardware Thermal Receipt Printer Route Handler.
 *
 * Receives print dispatch requests from the kiosk confirmation workflow, verifies
 * patient queue ticket registration in the database, formats the layout using ESC/POS
 * control commands, and writes the raw binary stream to physical USB printer device
 * nodes (/dev/usb/lp*).
 *
 * Security Enhancements (SEC-029 / SEC-AUD-006):
 * - Database Record Verification: Requires matching patient record in the database before printing,
 *   rejecting unauthorized or fictitious ticket floods with HTTP 404.
 * - Input Sanitization: Strips non-printable characters and illegal ESC/POS control sequences.
 * - Hardware Lock: Maintains single-threaded serial write lock to prevent device buffer collisions.
 *
 * @module app/api/print-ticket/route
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { getTimestamp } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

/**
 * Global mutex flag to prevent overlapping concurrent writes to hardware USB device nodes.
 */
let isPrinterBusy = false;

/**
 * Sanitizes input string to prevent binary ESC/POS control code injection.
 * Removes non-printable characters while preserving standard alphanumeric and punctuation.
 *
 * @param input - The raw string value to sanitize.
 * @returns Sanitized string safe for ESC/POS printing.
 */
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim();
}

/**
 * Handles POST requests to print a physical patient queue ticket.
 *
 * @param request - Next.js Request object with JSON body containing queueNumber, serviceName, cubicle.
 * @returns NextResponse with status and operation result.
 */
export async function POST(request: Request) {
  // Guard clause: Reject overlapping requests cleanly to prevent hardware state lock
  if (isPrinterBusy) {
    console.warn(
      `${getTimestamp()} [PRINTER BUSY] Duplicate print request received - rejecting to prevent hardware conflict.`
    );
    return NextResponse.json({ success: true, message: 'Printer busy, skipped.' });
  }

  isPrinterBusy = true; // Acquire hardware lock

  try {
    const body = await request.json();
    const rawQueueNumber = body?.queueNumber;
    const rawServiceName = body?.serviceName;
    const rawCubicle = body?.cubicle;

    const queueNumber = sanitizeText(rawQueueNumber);
    const serviceName = sanitizeText(rawServiceName);
    const cubicle = sanitizeText(rawCubicle);

    if (!queueNumber) {
      console.error(`${getTimestamp()} [PRINT VALIDATION] Missing or invalid queue number`);
      return NextResponse.json({ error: 'Valid queue number is required' }, { status: 400 });
    }

    // Defensive Verification (SEC-029): Verify ticket exists in active patients table
    const { data: patientRecord, error: dbError } = await supabase
      .from('patients')
      .select('id, created_at, patientNum, phoneNum, service')
      .eq('patientNum', queueNumber)
      .eq('is_historical', false)
      .maybeSingle();

    if (dbError) {
      console.error(
        `${getTimestamp()} [PRINT DB ERROR] Error fetching patient ticket: ${dbError.message}`
      );
      return NextResponse.json(
        { error: 'Database verification failed prior to print.' },
        { status: 500 }
      );
    }

    if (!patientRecord) {
      console.warn(
        `${getTimestamp()} [PRINT REJECTED] Unregistered queue ticket: ${queueNumber}`
      );
      return NextResponse.json(
        { error: 'Queue ticket not found or invalid for printing.' },
        { status: 404 }
      );
    }

    console.log(`${getTimestamp()} [PRINT REQUEST] Verified print job:`, {
      id: patientRecord.id,
      patientNum: patientRecord.patientNum,
      service: patientRecord.service,
    });

    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    // Standard ESC/POS Control Sequences
    const ESC = '\x1b';
    const GS = '\x1d';
    const RESET = ESC + '@';
    const CENTER = ESC + 'a\x01';
    const LEFT = ESC + 'a\x00';
    const BOLD_ON = ESC + 'E\x01';
    const BOLD_OFF = ESC + 'E\x00';
    const LARGE_FONT = GS + '!\x11';
    const NORMAL_FONT = GS + '!\x00';
    const CUT = GS + 'V\x00';

    // Construct the ticket layout
    const ticketData =
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
      `Service: ${serviceName || patientRecord.service || 'General'}\n` +
      `Location: ${cubicle || 'Waiting Area'}\n\n` +
      CENTER +
      LARGE_FONT +
      BOLD_ON +
      `${queueNumber}` +
      BOLD_OFF +
      NORMAL_FONT +
      '\n' +
      '\nPlease wait for your number.\n' +
      '--------------------------------\n' +
      '\n\n\n\n\n' +
      CUT;

    // Convert string to latin1 printer buffer
    const buffer = Buffer.from(ticketData, 'latin1');

    // Candidate thermal printer USB device nodes
    const printerPaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
    let printedSuccessfully = false;
    let lastError = '';

    for (const path of printerPaths) {
      if (existsSync(path)) {
        try {
          await fs.writeFile(path, buffer);
          console.log(
            `${getTimestamp()} [PRINT SUCCESS] Ticket printed to device - Queue: ${queueNumber}, Service: ${serviceName}, Device: ${path}, Size: ${buffer.length} bytes`
          );
          printedSuccessfully = true;
          break;
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          lastError = `Access denied on ${path}: ${message}`;
          console.warn(
            `${getTimestamp()} [PRINTER DEVICE ERROR] Failed to write to device - Path: ${path}, Queue: ${queueNumber}, Error: ${message}`
          );
        }
      }
    }

    if (!printedSuccessfully) {
      console.error(
        `${getTimestamp()} [PRINT FAILURE] No printer device available - Queue: ${queueNumber}, Service: ${serviceName}, Attempted paths: ${printerPaths.join(', ')}`
      );
      return NextResponse.json(
        { success: false, error: lastError || 'No printer device found.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        queueNumber,
        serviceName,
        cubicle,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    console.error(
      `${getTimestamp()} [PRINT SERVER ERROR] Unexpected error in print route:`,
      message
    );
    return NextResponse.json({ success: false, error: 'Internal server print error.' }, { status: 500 });
  } finally {
    // Release printer lock after cooldown delay
    setTimeout(() => {
      isPrinterBusy = false;
    }, 500);
  }
}