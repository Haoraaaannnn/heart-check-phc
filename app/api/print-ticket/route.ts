/**
 * @fileoverview Hardware Thermal Receipt Printer Route Handler with Estimated Wait Time (EWT).
 *
 * Receives print dispatch requests from the kiosk confirmation workflow, verifies
 * patient queue ticket registration in the database, computes/persists estimated wait time,
 * formats the layout using ESC/POS control commands, dispatches confirmation SMS,
 * and writes the raw binary stream to physical USB printer device nodes (/dev/usb/lp*).
 *
 * Security Enhancements (SEC-029 / SEC-AUD-006):
 * - Database Record Verification: Requires matching patient record in the database before printing,
 *   rejecting unauthorized or fictitious ticket floods with HTTP 404.
 * - Input Sanitization: Strips non-printable characters and illegal ESC/POS control sequences.
 * - Hardware Lock: Maintains single-threaded serial write lock to prevent device buffer collisions.
 * - Historical Data Immutability: EWT updates strictly enforce `is_historical = false`.
 * - SMS Privacy & Rate Limiting: Patient contact details masked; toll fraud throttled via cooldown.
 *
 * @module app/api/print-ticket/route
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { getTimestamp } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeEstimatedWaitMinutes } from './ewtComputation';
import { PRINT_TEXTS } from './constants/printTexts';
import { formatEwtLabel, formatEwtReceiptLabel } from '@/app/kiosk/constants/ewtTexts';
import { sendQueueConfirmationSMS } from '@/app/actions/sendQueueConfirmationSMS';

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
 * Handles POST requests to print a physical patient queue ticket and calculate EWT.
 *
 * @param request - Next.js Request object with JSON body containing queueNumber, serviceName, cubicle.
 * @returns NextResponse with status, estimated wait time data, and operation result.
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

    // Resolve server-side database client (prefers admin client to allow EWT write)
    let dbClient = supabase;
    try {
      dbClient = createAdminClient();
    } catch {
      dbClient = supabase;
    }

    // Defensive Verification (SEC-029): Verify ticket exists in active patients table
    const { data: patientRecord, error: dbError } = await dbClient
      .from('patients')
      .select('id, created_at, patientNum, phoneNum, service, cubicleNum, preferredCubicleNums, estimated_wait_minutes')
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

    const displayService = serviceName || patientRecord.service || 'General Service';
    const fallbackDbCubicle =
      patientRecord.cubicleNum ||
      (Array.isArray(patientRecord.preferredCubicleNums) && patientRecord.preferredCubicleNums[0]) ||
      'Waiting Area';

    const targetCubicle =
      !cubicle || cubicle === '---' || cubicle.toLowerCase() === 'waiting area'
        ? fallbackDbCubicle
        : cubicle;
    const displayCubicle =
      targetCubicle === 'Waiting Area'
        ? targetCubicle
        : targetCubicle.replace(/^cubicle\s*/i, '');

    // 1. Calculate or reuse Estimated Wait Time (EWT)
    let ewtMinutes: number = patientRecord.estimated_wait_minutes ?? 15;
    if (patientRecord.estimated_wait_minutes === null || patientRecord.estimated_wait_minutes === undefined) {
      const ewtResult = await computeEstimatedWaitMinutes(
        dbClient,
        displayService,
        patientRecord.created_at
      );
      ewtMinutes = ewtResult.estimatedWaitMinutes;

      // Persist computed EWT to database (conditioned on is_historical = false)
      const { error: updateError } = await dbClient
        .from('patients')
        .update({ estimated_wait_minutes: ewtMinutes })
        .eq('id', patientRecord.id)
        .eq('is_historical', false);

      if (updateError) {
        console.warn(
          `${getTimestamp()} [PRINT EWT SAVE WARNING] Could not persist estimated_wait_minutes: ${updateError.message}`
        );
      } else {
        console.log(
          `${getTimestamp()} [PRINT EWT SAVED] Ticket ${queueNumber} wait estimated: ${ewtMinutes}m`
        );
      }
    }

    // 2. Dispatch queue confirmation SMS asynchronously if phone number is registered
    if (patientRecord.phoneNum) {
      sendQueueConfirmationSMS(
        patientRecord.phoneNum,
        queueNumber,
        displayService,
        ewtMinutes
      ).catch((smsErr) => {
        console.warn(
          `${getTimestamp()} [PRINT CONFIRMATION SMS ERROR] Failed to send SMS:`,
          smsErr
        );
      });
    }

    console.log(`${getTimestamp()} [PRINT REQUEST] Verified print job:`, {
      id: patientRecord.id,
      patientNum: patientRecord.patientNum,
      service: displayService,
      estimatedWaitMinutes: ewtMinutes,
    });

    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const timeStr = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(now);

    const ewtReceiptText = formatEwtReceiptLabel(ewtMinutes);

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

    // Construct the ticket layout with Estimated Wait Time line
    const ticketData =
      RESET +
      CENTER +
      BOLD_ON +
      PRINT_TEXTS.headerTitle +
      BOLD_OFF +
      '\n' +
      PRINT_TEXTS.separatorDouble +
      LEFT +
      `${PRINT_TEXTS.dateLabel} ${dateStr}\n` +
      `${PRINT_TEXTS.timeLabel} ${timeStr} ${PRINT_TEXTS.timeSuffix}\n` +
      `${PRINT_TEXTS.serviceLabel} ${displayService}\n` +
      `${PRINT_TEXTS.cubicleLabel} ${displayCubicle}\n` +
      PRINT_TEXTS.separatorSingle +
      CENTER +
      LARGE_FONT +
      BOLD_ON +
      `${queueNumber}` +
      BOLD_OFF +
      NORMAL_FONT +
      '\n' +
      PRINT_TEXTS.separatorSingle +
      LEFT +
      `${PRINT_TEXTS.ewtLabel} ${ewtReceiptText}\n` +
      PRINT_TEXTS.separatorDouble +
      CENTER +
      PRINT_TEXTS.reminderFil1 +
      PRINT_TEXTS.reminderFil2 +
      PRINT_TEXTS.reminderFil3 +
      PRINT_TEXTS.reminderEn1 +
      PRINT_TEXTS.reminderEn2 +
      PRINT_TEXTS.ewtDisclaimer +
      PRINT_TEXTS.separatorDouble +
      '\n\n\n\n\n' +
      CUT;

    // Convert string to latin1 printer buffer
    const buffer = Buffer.from(ticketData, 'latin1');

    // Candidate thermal printer USB device nodes
    const printerPaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
    let printedSuccessfully = false;
    let lastError = '';

    for (const path of printerPaths) {
      if (existsSync(/*turbopackIgnore: true*/ path)) {
        try {
          await fs.writeFile(/*turbopackIgnore: true*/ path, buffer);
          console.log(
            `${getTimestamp()} [PRINT SUCCESS] Ticket printed to device - Queue: ${queueNumber}, Service: ${displayService}, Device: ${path}, Size: ${buffer.length} bytes`
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
      console.warn(
        `${getTimestamp()} [PRINT NOTICE] Hardware printer not attached or offline - Queue: ${queueNumber}. Returning success with EWT for display.`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        queueNumber,
        serviceName: displayService,
        cubicle: displayCubicle,
        estimatedWaitMinutes: ewtMinutes,
        estimatedWaitLabel: formatEwtLabel(ewtMinutes),
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