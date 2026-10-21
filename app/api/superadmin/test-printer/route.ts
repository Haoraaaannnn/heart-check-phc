/**
 * @fileoverview Authorized Thermal Receipt Printer Diagnostic Endpoint for SuperAdmin.
 *
 * Dispatches test receipts to configured Network IP sockets (port 9100) or host
 * Linux device nodes (/dev/usb/lp*).
 *
 * Security Requirements (SEC-024 / SEC-029 / SEC-032):
 * - Guarded strictly with `requireSuperadmin(request)` to prevent unauthorized abuse.
 * - IP and hostname sanitization preventing Server-Side Request Forgery (SSRF).
 * - Enforces single-threaded write lock and 4-second socket timeout.
 *
 * @module app/api/superadmin/test-printer/route
 */

import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/supabase/superadminGuard';
import { sendToNetworkPrinter, isValidPrinterHost } from '@/lib/printer/networkPrinter';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { getTimestamp } from '@/lib/logger';

/**
 * Handles POST requests to test thermal printer connectivity.
 *
 * @param request - Next.js Request object with JSON body containing method and optional printerIp.
 * @returns NextResponse with operation status.
 */
export async function POST(request: Request) {
  const guard = await requireSuperadmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));
    const method = body?.method || 'network';
    const rawIp = (body?.printerIp || process.env.PRINTER_IP || process.env.PRINTER_HOST || '').trim();

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

    // Standard ESC/POS Control Sequences
    const ESC = '\x1b';
    const GS = '\x1d';
    const RESET = ESC + '@';
    // High-Density Thermal Parameters: ESC 7 <max_dots=7> <heat_time=20> <heat_interval=2>
    const HIGH_DENSITY = ESC + '7\x07\x14\x02';
    // Double-strike mode: pulses thermal elements twice per dot for solid black text
    const DOUBLE_STRIKE_ON = ESC + 'G\x01';
    const DOUBLE_STRIKE_OFF = ESC + 'G\x00';
    const CENTER = ESC + 'a\x01';
    const LEFT = ESC + 'a\x00';
    const BOLD_ON = ESC + 'E\x01';
    const BOLD_OFF = ESC + 'E\x00';
    const CUT = GS + 'V\x00';

    const testTicket =
      RESET +
      HIGH_DENSITY +
      DOUBLE_STRIKE_ON +
      CENTER +
      BOLD_ON +
      'HEART CHECK PHC\n' +
      'HARDWARE PRINTER TEST\n' +
      BOLD_OFF +
      '================================\n' +
      LEFT +
      `Date: ${dateStr}\n` +
      `Time: ${timeStr} (PHT)\n` +
      `Mode: ${method.toUpperCase()}\n` +
      `Target: ${rawIp || 'Local Device'}\n` +
      '--------------------------------\n' +
      CENTER +
      BOLD_ON +
      'STATUS: OPERATIONAL\n' +
      BOLD_OFF +
      '--------------------------------\n' +
      'Testing ESC/POS connectivity\n' +
      'and thermal cutter execution.\n' +
      '================================\n' +
      DOUBLE_STRIKE_OFF +
      '\n\n\n\n\n' +
      CUT;

    const buffer = Buffer.from(testTicket, 'latin1');

    if (method === 'network') {
      if (!rawIp || !isValidPrinterHost(rawIp)) {
        return NextResponse.json(
          { error: `Invalid or missing network printer IP address: "${rawIp}"` },
          { status: 400 }
        );
      }

      console.log(`${getTimestamp()} [SUPERADMIN TEST PRINT] Dispatching to ${rawIp}:9100`);
      const result = await sendToNetworkPrinter(rawIp, buffer, 9100, 4000);
      if (!result.success) {
        return NextResponse.json(
          { error: `Network printer socket failed: ${result.message}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Test receipt printed successfully over network socket (${rawIp}:9100).`,
      });
    }

    if (method === 'device') {
      const printerPaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
      let written = false;
      let lastErr = '';

      for (const path of printerPaths) {
        if (existsSync(/*turbopackIgnore: true*/ path)) {
          try {
            await fs.writeFile(/*turbopackIgnore: true*/ path, buffer);
            written = true;
            console.log(`${getTimestamp()} [SUPERADMIN TEST PRINT] Written to ${path}`);
            break;
          } catch (e: unknown) {
            lastErr = e instanceof Error ? e.message : String(e);
          }
        }
      }

      if (!written) {
        return NextResponse.json(
          { error: `No accessible /dev/usb/lp* node found: ${lastErr || 'Devices offline or permission denied'}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Test receipt printed successfully to local Linux device node.',
      });
    }

    return NextResponse.json({ error: 'Unknown print method specified.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server diagnostic error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
