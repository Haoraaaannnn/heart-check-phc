import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { getTimestamp } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

let isPrinterBusy = false; 

export async function POST(request: Request) {
  if (isPrinterBusy) {
    console.warn(`${getTimestamp()} ⚠️ [PRINTER BUSY] Duplicate print request received - Queue: pending, rejecting to prevent hardware conflict.`);
    return NextResponse.json({ success: true, message: "Printer busy, skipped." });
  }

  isPrinterBusy = true;

  try {
    const body = await request.json();
    const { queueNumber, serviceName, cubicle } = body;
    const { data: patientRecord } = await supabase.from('patients').select().eq('patientNum', queueNumber).single();

    console.log(`${getTimestamp()} 📋 [PRINT REQUEST] Received print job:`, { id: patientRecord?.id, created_at: patientRecord?.created_at, patientNum: patientRecord?.patientNum, phoneNum: patientRecord?.phoneNum, service: patientRecord?.service });

    if (!queueNumber) {
      console.error(`${getTimestamp()} ❌ [PRINT VALIDATION] Missing queue number in request body`);
      return NextResponse.json({ error: 'Queue number is required' }, { status: 400 });
    }

    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    // ESC/POS Commands
    const ESC = '\x1b';
    const GS = '\x1d';
    const RESET = ESC + '@';
    const CENTER = ESC + 'a' + '\x01';
    const LEFT = ESC + 'a' + '\x00';
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const LARGE_FONT = GS + '!' + '\x11'; // Double height and width
    const NORMAL_FONT = GS + '!' + '\x00';
    const CUT = GS + 'V' + '\x00';

    const ticketData = 
      RESET + 
      CENTER + BOLD_ON + 'HEART CHECK PHC' + BOLD_OFF + '\n' +
      '--------------------------------\n' +
      LEFT + 
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Service: ${serviceName}\n` +
      `Location: ${cubicle || 'Waiting Area'}\n\n` +
      CENTER + 
      LARGE_FONT + BOLD_ON + `${queueNumber}` + BOLD_OFF + NORMAL_FONT + '\n' +
      '\nPlease wait for your number.\n' +
      '--------------------------------\n' +
      '\n\n\n\n\n' + 
      CUT;    


    const buffer = Buffer.from(ticketData, 'latin1');
    
    // Add the printer (linux)
    const printerPaths = ['/dev/usb/lp2', '/dev/usb/lp0', '/dev/usb/lp1'];
    let printedSuccessfully = false;
    let lastError = "";

    for (const path of printerPaths) {
      if (existsSync(path)) {
        try {
          await fs.writeFile(path, buffer);
          console.log(`${getTimestamp()} [PRINT SUCCESS] Ticket printed to device - Queue: ${queueNumber}, Service: ${serviceName}, Device: ${path}, Size: ${buffer.length} bytes`);
          printedSuccessfully = true;
          break; 
        } catch (e: any) {
          lastError = `Access denied on ${path}.`;
          console.warn(`${getTimestamp()} [PRINTER DEVICE ERROR] Failed to write to device - Path: ${path}, Queue: ${queueNumber}, Error: ${e.message}`);
        }
      }
    }

    if (!printedSuccessfully) {
      console.error(`${getTimestamp()} [PRINT FAILURE] No printer device available - Queue: ${queueNumber}, Service: ${serviceName}, Attempted paths: ${printerPaths.join(', ')}`);
      return NextResponse.json({ success: false, error: lastError || "No printer device found." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { queueNumber, serviceName, cubicle, timestamp: new Date().toISOString() } });

  } catch (error: any) {
    console.error(`${getTimestamp()} [PRINT SERVER ERROR] Unexpected error in print route - Error: ${error.message}, Stack: ${error.stack}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {

    setTimeout(() => {
      isPrinterBusy = false;
    }, 500); 
  }
}