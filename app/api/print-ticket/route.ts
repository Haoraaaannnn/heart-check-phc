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
import {
  computeEstimatedWaitMinutes,
  formatEwtLabel,
  formatEwtReceiptLabel,
} from './ewtComputation';
import { PRINT_TEXTS } from './constants/printTexts';
import { sendQueueConfirmationSMS } from '@/app/actions/sendQueueConfirmationSMS';
import {
  sendToNetworkPrinter,
  isValidPrinterHost,
  queryNetworkPrinterStatus,
} from '@/lib/printer/networkPrinter';
import { buildHardwareStatus } from '@/lib/printer/statusParser';

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
      '%s [PRINTER BUSY] Duplicate print request received - rejecting to prevent hardware conflict.',
      getTimestamp()
    );
    return NextResponse.json({ success: false, error: 'Printer busy. Please retry this ticket.' },
      { status: 409, headers: { 'Retry-After': '1' } });
  }

  isPrinterBusy = true; // Acquire hardware lock

  try {
    const body = await request.json();
    const rawQueueNumber = body?.queueNumber;
    const rawServiceName = body?.serviceName;
    const rawCubicle = body?.cubicle;
    const rawPatientId = body?.patientId;

    const queueNumber = sanitizeText(rawQueueNumber);
    const serviceName = sanitizeText(rawServiceName);
    const cubicle = sanitizeText(rawCubicle);
    const patientId =
      typeof rawPatientId === 'number' || (typeof rawPatientId === 'string' && /^\d+$/.test(rawPatientId))
        ? Number(rawPatientId)
        : null;

    if (!queueNumber && !patientId) {
      console.error('%s [PRINT VALIDATION] Missing or invalid queue number', getTimestamp());
      return NextResponse.json({ error: 'Valid queue number is required' }, { status: 400 });
    }

    // Resolve server-side database client (prefers admin client to allow EWT write)
    let dbClient = supabase;
    try {
      dbClient = createAdminClient();
    } catch {
      dbClient = supabase;
    }

    // Defensive Verification (SEC-029): Verify ticket exists in active patients table.
    // Use patientId if available, or order by created_at DESC and limit(1) to avoid
    // PostgREST maybeSingle errors when queue numbers repeat across days or test batches.
    let query = dbClient
      .from('patients')
      .select('id, created_at, patientNum, phoneNum, service, cubicleNum, preferredCubicleNums, estimated_wait_minutes')
      .eq('is_historical', false);

    if (patientId) {
      query = query.eq('id', patientId);
    } else {
      query = query
        .eq('patientNum', queueNumber)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data: patientRecord, error: dbError } = await query.maybeSingle();

    if (dbError) {
      console.error(
        '%s [PRINT DB ERROR] Error fetching patient ticket: %s',
        getTimestamp(),
        dbError.message
      );
      return NextResponse.json(
        { error: 'Database verification failed prior to print.' },
        { status: 500 }
      );
    }

    if (!patientRecord) {
      console.warn(
        '%s [PRINT REJECTED] Unregistered queue ticket: %s',
        getTimestamp(),
        queueNumber
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
          '%s [PRINT EWT SAVE WARNING] Could not persist estimated_wait_minutes: %s',
          getTimestamp(),
          updateError.message
        );
      } else {
        console.log(
          '%s [PRINT EWT SAVED] Ticket %s wait estimated: %dm',
          getTimestamp(),
          queueNumber,
          ewtMinutes
        );
      }
    }

    // 2. Dispatch queue confirmation SMS asynchronously if phone number is registered
    if (patientRecord.phoneNum) {
      sendQueueConfirmationSMS({
        phoneNum: patientRecord.phoneNum, patientNum: queueNumber, serviceName: displayService,
        ewtMinutes, patientId: patientRecord.id,
      }).catch((smsErr) => {
        console.warn(
          '%s [PRINT CONFIRMATION SMS ERROR] Failed to send SMS: %s',
          getTimestamp(),
          smsErr instanceof Error ? smsErr.message : String(smsErr)
        );
      });
    }

    console.log('%s [PRINT REQUEST] Verified print job: %s', getTimestamp(), JSON.stringify({
      id: patientRecord.id,
      patientNum: patientRecord.patientNum,
      service: displayService,
      estimatedWaitMinutes: ewtMinutes,
    }));

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
    // High-Density Thermal Parameters: ESC 7 <max_dots=7> <heat_time=20> <heat_interval=2>
    // Increases dot burn time to eliminate faint/washed-out printing on thermal paper
    const HIGH_DENSITY = ESC + '7\x07\x14\x02';
    // Double-strike mode: pulses thermal elements twice per dot for rich, solid black text
    const DOUBLE_STRIKE_ON = ESC + 'G\x01';
    const DOUBLE_STRIKE_OFF = ESC + 'G\x00';
    const CENTER = ESC + 'a\x01';
    const LEFT = ESC + 'a\x00';
    const BOLD_ON = ESC + 'E\x01';
    const BOLD_OFF = ESC + 'E\x00';
    const LARGE_FONT = GS + '!\x11';
    const NORMAL_FONT = GS + '!\x00';
    const CUT = GS + 'V\x00';

    // Construct the ticket layout with Estimated Wait Time line and high-density dark burn
    const ticketData =
      RESET +
      HIGH_DENSITY +
      DOUBLE_STRIKE_ON +
      CENTER +
      BOLD_ON +
      PRINT_TEXTS.headerTitle +
      BOLD_OFF +
      '\n' +
      PRINT_TEXTS.separatorDouble +
      LEFT +
      `${PRINT_TEXTS.dateLabel} ${dateStr}\n` +
      `${PRINT_TEXTS.timeLabel} ${timeStr} ${PRINT_TEXTS.timeSuffix}\n` +
      BOLD_ON +
      `${PRINT_TEXTS.serviceLabel} ${displayService}\n` +
      `${PRINT_TEXTS.cubicleLabel} ${displayCubicle}\n` +
      BOLD_OFF +
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
      BOLD_ON +
      `${PRINT_TEXTS.ewtLabel} ${ewtReceiptText}\n` +
      BOLD_OFF +
      PRINT_TEXTS.separatorDouble +
      CENTER +
      PRINT_TEXTS.reminderFil1 +
      PRINT_TEXTS.reminderFil2 +
      PRINT_TEXTS.reminderFil3 +
      PRINT_TEXTS.reminderEn1 +
      PRINT_TEXTS.reminderEn2 +
      PRINT_TEXTS.ewtDisclaimer +
      PRINT_TEXTS.separatorDouble +
      DOUBLE_STRIKE_OFF +
      '\n\n\n\n\n' +
      CUT;

    // Convert string to latin1 printer buffer
    const buffer = Buffer.from(ticketData, 'latin1');

    let printedSuccessfully = false;
    let printMethod: 'network' | 'device' | 'client_webusb_required' | 'none' = 'client_webusb_required';
    let lastError = '';

    // 1. Attempt Network Ethernet / Wi-Fi Printer if host IP is configured in server environment
    const configuredPrinterIp = (process.env.PRINTER_IP || process.env.PRINTER_HOST || '').trim();
    if (configuredPrinterIp && isValidPrinterHost(configuredPrinterIp)) {
      console.log(
        '%s [PRINT DISPATCH] Attempting network socket dispatch to %s:9100',
        getTimestamp(),
        configuredPrinterIp
      );
      const networkResult = await sendToNetworkPrinter(configuredPrinterIp, buffer, 9100, 3500);
      if (networkResult.success) {
        printedSuccessfully = true;
        printMethod = 'network';
        console.log(
          '%s [PRINT SUCCESS] Ticket printed via Network Socket: %s:9100',
          getTimestamp(),
          configuredPrinterIp
        );
      } else {
        console.warn(
          '%s [NETWORK PRINT RETRY] Network print to %s failed: %s',
          getTimestamp(),
          configuredPrinterIp,
          networkResult.message
        );
      }
    }

    // 2. Fallback: Check local Linux USB printer device nodes (/dev/usb/lp*)
    if (!printedSuccessfully) {
      const printerPaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
      for (const path of printerPaths) {
        if (existsSync(/*turbopackIgnore: true*/ path)) {
          try {
            await fs.writeFile(/*turbopackIgnore: true*/ path, buffer);
            console.log(
              '%s [PRINT SUCCESS] Ticket printed to device node - Queue: %s, Service: %s, Device: %s, Size: %d bytes',
              getTimestamp(),
              queueNumber,
              displayService,
              path,
              buffer.length
            );
            printedSuccessfully = true;
            printMethod = 'device';
            break;
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            lastError = `Access denied on ${path}: ${message}`;
            console.warn(
              '%s [PRINTER DEVICE ERROR] Failed to write to device node - Path: %s, Queue: %s, Error: %s',
              getTimestamp(),
              path,
              queueNumber,
              message
            );
          }
        }
      }
    }

    if (!printedSuccessfully) {
      console.log(
        '%s [PRINT NOTICE] Server hardware printer not reached - Queue: %s%s. Returning ESC/POS base64 payload for client-side WebUSB/Serial dispatch.',
        getTimestamp(),
        queueNumber,
        lastError ? ` (${lastError})` : ''
      );
    }

    const hardwareStatus = printedSuccessfully
      ? buildHardwareStatus(
          'ready',
          printMethod === 'client_webusb_required' ? 'none' : printMethod,
          printMethod === 'network' ? `Network (${configuredPrinterIp})` : 'Linux USB Node',
          'Ticket printed successfully'
        )
      : buildHardwareStatus(
          'not_detected',
          'none',
          'No Server Printer Reached',
          lastError || 'Server did not print ticket; client fallback active'
        );

    return NextResponse.json({
      success: true,
      data: {
        queueNumber,
        serviceName: displayService,
        cubicle: displayCubicle,
        estimatedWaitMinutes: ewtMinutes,
        estimatedWaitLabel: formatEwtLabel(ewtMinutes),
        printMethod,
        printed: printedSuccessfully,
        hardwareStatus,
        escposBase64: buffer.toString('base64'),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    console.error(
      '%s [PRINT SERVER ERROR] Unexpected error in print route: %s',
      getTimestamp(),
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

/**
 * Handles GET requests to probe server-configured printer hardware status.
 *
 * @returns NextResponse with {@link PrinterHardwareStatus} diagnostic telemetry.
 */
export async function GET() {
  try {
    const configuredPrinterIp = (process.env.PRINTER_IP || process.env.PRINTER_HOST || '').trim();
    if (configuredPrinterIp && isValidPrinterHost(configuredPrinterIp)) {
      const status = await queryNetworkPrinterStatus(configuredPrinterIp, 9100, 2000);
      return NextResponse.json({ success: true, status });
    }

    // Check local Linux USB printer device nodes (/dev/usb/lp*)
    const printerPaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
    for (const path of printerPaths) {
      if (existsSync(/*turbopackIgnore: true*/ path)) {
        try {
          await fs.access(/*turbopackIgnore: true*/ path, 2 /* W_OK */);
          const status = buildHardwareStatus(
            'ready',
            'device',
            `Linux USB Node (${path})`,
            'Device node writable'
          );
          return NextResponse.json({ success: true, status });
        } catch {
          const status = buildHardwareStatus(
            'offline',
            'device',
            `Linux USB Node (${path})`,
            'Permission denied (EACCES) on device node'
          );
          return NextResponse.json({ success: true, status });
        }
      }
    }

    const notDetectedStatus = buildHardwareStatus(
      'not_detected',
      'none',
      'No Server Printer Configured',
      'No network IP or local USB device node configured on the server.'
    );
    return NextResponse.json({ success: true, status: notDetectedStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        status: buildHardwareStatus('offline', 'none', 'Error Probing Printer', msg),
      },
      { status: 500 }
    );
  }
}
