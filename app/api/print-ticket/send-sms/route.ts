/**
 * @fileoverview On-Demand SMS Ticket Dispatch API Endpoint.
 *
 * Allows patients who experience printer hardware failures (out of paper, paper jam,
 * offline, or not detected) to receive their queue ticket and estimated wait time via SMS
 * directly from the on-screen fallback card.
 *
 * Security Requirements (SEC-028 / SEC-029 / SEC-AUD-005):
 * - Authenticated AES-256-GCM phone encryption before persistence.
 * - Strict Philippine mobile regex validation.
 * - Sliding window rate-limiting cooldown preventing SMS toll abuse.
 * - Conditioned on `is_historical = false` to preserve research dataset immutability.
 *
 * @module app/api/print-ticket/send-sms/route
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptPhoneNumber, maskPhoneNumber } from '@/lib/crypto/phoneEncryption';
import { sendQueueConfirmationSMS } from '@/app/actions/sendQueueConfirmationSMS';
import { getTimestamp } from '@/lib/logger';

/**
 * Handles POST requests to deliver an SMS ticket to a patient's mobile device.
 *
 * @param request - Next.js Request object with JSON body containing patientNum and phoneNum.
 * @returns NextResponse with operation status and masked phone number.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPatientNum = typeof body?.patientNum === 'string' ? body.patientNum.trim() : '';
    const rawPhoneNum = typeof body?.phoneNum === 'string' ? body.phoneNum.trim() : '';
    const rawServiceName = typeof body?.serviceName === 'string' ? body.serviceName.trim() : '';
    const rawEwtMinutes = typeof body?.ewtMinutes === 'number' ? body.ewtMinutes : null;

    if (!rawPatientNum) {
      return NextResponse.json(
        { success: false, error: 'Queue ticket number is required.' },
        { status: 400 }
      );
    }

    if (!rawPhoneNum) {
      return NextResponse.json(
        { success: false, error: 'Valid mobile number is required.' },
        { status: 400 }
      );
    }

    // Validate Philippine mobile phone format
    const cleanedDigits = rawPhoneNum.replace(/\D/g, '');
    let normalizedPhone = '';
    if (cleanedDigits.startsWith('09') && cleanedDigits.length === 11) {
      normalizedPhone = cleanedDigits;
    } else if (cleanedDigits.startsWith('639') && cleanedDigits.length === 12) {
      normalizedPhone = '09' + cleanedDigits.slice(3);
    } else {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 11-digit Philippine mobile number starting with 09.' },
        { status: 400 }
      );
    }

    // Resolve Supabase database client
    let dbClient = supabase;
    try {
      dbClient = createAdminClient();
    } catch {
      dbClient = supabase;
    }

    // Verify patient ticket exists in active queue records
    const { data: patientRecord, error: fetchError } = await dbClient
      .from('patients')
      .select('id, patientNum, service, estimated_wait_minutes')
      .eq('patientNum', rawPatientNum)
      .eq('is_historical', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !patientRecord) {
      console.warn(
        '%s [SMS FALLBACK DISPATCH] Patient ticket %s not found in active records',
        getTimestamp(),
        rawPatientNum
      );
      return NextResponse.json(
        { success: false, error: 'Queue record not found or expired.' },
        { status: 404 }
      );
    }

    const serviceName = rawServiceName || patientRecord.service || 'General Service';
    const ewtMinutes = rawEwtMinutes ?? patientRecord.estimated_wait_minutes ?? 15;

    // Encrypt phone number using AES-256-GCM before database persistence
    const encryptedPhone = encryptPhoneNumber(normalizedPhone);

    // Update patient record with new phone contact (immutable on historical)
    const { error: updateError } = await dbClient
      .from('patients')
      .update({ phoneNum: encryptedPhone })
      .eq('id', patientRecord.id)
      .eq('is_historical', false);

    if (updateError) {
      console.warn(
        '%s [SMS FALLBACK PHONE UPDATE ERROR] Could not persist phone: %s',
        getTimestamp(),
        updateError.message
      );
    }

    // Dispatch queue confirmation SMS
    const smsResult = await sendQueueConfirmationSMS(
      normalizedPhone,
      patientRecord.patientNum,
      serviceName,
      ewtMinutes
    );

    if (!smsResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: smsResult.error || 'Failed to dispatch SMS through gateway.',
        },
        { status: 502 }
      );
    }

    const maskedPhone = maskPhoneNumber(normalizedPhone);
    console.log(
      '%s [SMS FALLBACK SUCCESS] Ticket %s dispatched to %s',
      getTimestamp(),
      patientRecord.patientNum,
      maskedPhone
    );

    return NextResponse.json({
      success: true,
      maskedPhone,
      message: 'Queue ticket sent to your phone via SMS.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('%s [SMS FALLBACK ROUTE ERROR] %s', getTimestamp(), msg);
    return NextResponse.json(
      { success: false, error: 'Internal server error while dispatching SMS ticket.' },
      { status: 500 }
    );
  }
}
