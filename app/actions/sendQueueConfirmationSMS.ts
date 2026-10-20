/**
 * @file sendQueueConfirmationSMS.ts
 * @description Next.js Server Action for Initial Queue Ticket Confirmation SMS Alerts.
 *
 * Dispatches an automated SMS alert via the UniSMS gateway upon kiosk ticket generation,
 * notifying the patient of their queue number, chosen service, and estimated wait time range.
 *
 * Security Considerations (SEC-028 / SEC-AUD-005):
 * - Data Privacy (RA 10173): Decrypts phone numbers in-memory server-side only. Zero patient names in SMS.
 * - Regex Phone Validation: Enforces strict Philippine mobile number format (+639XXXXXXXXX or 09XXXXXXXXX).
 * - Rate Limiting & Cost Protection: Throttles duplicate dispatches to the same number within 30 seconds.
 * - Secret Isolation: UniSMS credentials remain strictly in server environment variables.
 * - Sanitized Output: Hides upstream API keys and gateway response internals.
 *
 * @module app/actions/sendQueueConfirmationSMS
 */

'use server';

import { decryptPhoneNumber } from '@/lib/crypto/phoneEncryption';
import { formatEwtSmsLabel } from '@/app/kiosk/constants/ewtTexts';
import { getTimestamp } from '@/lib/logger';

/**
 * Sliding window rate limit cache for queue confirmation dispatches.
 */
interface SmsCooldownRecord {
  lastSentAt: number;
}

const confirmationCooldownMap = new Map<string, SmsCooldownRecord>();

/** Minimum cooldown in milliseconds between messages to the same phone number (30 seconds). */
const CONFIRMATION_COOLDOWN_MS = 30 * 1000;

/** Maximum lifetime for tracking cooldown keys (10 minutes). */
const COOLDOWN_TTL_MS = 10 * 60 * 1000;

/**
 * Validates and normalizes Philippine mobile phone numbers to E.164 (+639XXXXXXXXX) format.
 *
 * @param phone - Raw or encrypted phone number string/number.
 * @returns Normalized phone string, or null if invalid format.
 */
function normalizePhilippinePhone(phone: unknown): string | null {
  if (typeof phone !== 'string' && typeof phone !== 'number') return null;
  const rawOrDecrypted = decryptPhoneNumber(phone as string | number) ?? String(phone);
  const cleaned = rawOrDecrypted.replace(/[\s-]/g, '').trim();

  let normalized = cleaned;
  if (normalized.startsWith('+63')) {
    normalized = normalized.slice(0, 13);
  } else if (normalized.startsWith('63')) {
    normalized = '+' + normalized.slice(1);
  } else if (normalized.startsWith('09')) {
    normalized = '+63' + normalized.slice(1);
  } else {
    return null;
  }

  const PH_MOBILE_REGEX = /^\+639\d{9}$/;
  return PH_MOBILE_REGEX.test(normalized) ? normalized : null;
}

/**
 * Enforces duplicate dispatch cooldown per destination phone number.
 *
 * @param recipient - E.164 formatted destination phone number.
 * @returns Object indicating whether dispatch is permitted.
 */
function checkConfirmationCooldown(recipient: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // Housekeeping: clean expired keys periodically
  if (confirmationCooldownMap.size > 200) {
    for (const [key, record] of confirmationCooldownMap.entries()) {
      if (now - record.lastSentAt > COOLDOWN_TTL_MS) {
        confirmationCooldownMap.delete(key);
      }
    }
  }

  const record = confirmationCooldownMap.get(recipient);
  if (record && now - record.lastSentAt < CONFIRMATION_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: 'Confirmation SMS sent too recently to this phone number.',
    };
  }

  confirmationCooldownMap.set(recipient, { lastSentAt: now });
  return { allowed: true };
}

/**
 * Dispatches an automated confirmation SMS to a newly queued patient with their EWT.
 *
 * @param phoneNum - Target Philippine mobile number (raw or AES-256-GCM ciphertext).
 * @param patientNum - Patient queue ticket identifier (e.g. "C001").
 * @param serviceName - Registered clinical service name.
 * @param ewtMinutes - Computed estimated wait time in minutes.
 * @returns Object with operation status or sanitized error message.
 *
 * @remarks
 * Called server-side from `/api/print-ticket/route.ts` upon successful ticket registration.
 */
export async function sendQueueConfirmationSMS(
  phoneNum: string | number | null | undefined,
  patientNum: string,
  serviceName: string,
  ewtMinutes: number | null | undefined
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!phoneNum) {
      return { success: true, message: 'No phone number provided; SMS skipped.' };
    }

    // 1. Validate and normalize recipient number
    const formattedRecipient = normalizePhilippinePhone(phoneNum);
    if (!formattedRecipient) {
      console.warn(
        `${getTimestamp()} [CONFIRMATION SMS] Invalid phone format for ticket ${patientNum}`
      );
      return { error: 'Invalid Philippine phone number format.' };
    }

    // 2. Cooldown check to prevent duplicate toll charges
    const cooldown = checkConfirmationCooldown(formattedRecipient);
    if (!cooldown.allowed) {
      console.warn(
        `${getTimestamp()} [CONFIRMATION SMS] Cooldown throttle active for ${formattedRecipient}`
      );
      return { error: cooldown.reason };
    }

    // 3. Sanitize template inputs (SEC-AUD-005)
    const safePatientNum = String(patientNum || '').replace(/[^\w-]/g, '').trim();
    const safeServiceName = String(serviceName || 'Consultation').replace(/[^\w\s-]/g, '').trim();
    const ewtLabel = formatEwtSmsLabel(ewtMinutes);

    // 4. Construct bilingual Taglish confirmation message
    const message =
      `Heart Check PHC: Matagumpay kang nakapag-pila!\n\n` +
      `Ticket No.: ${safePatientNum}\n` +
      `Serbisyo: ${safeServiceName}\n` +
      `Tinatayang oras: ${ewtLabel}\n\n` +
      `Pakiabangan ang inyong numero sa monitor. Ang oras ay pagtatantya lamang. Salamat!`;

    if (!process.env.UNISMS_API_KEY) {
      console.warn(
        `${getTimestamp()} [CONFIRMATION SMS] UNISMS_API_KEY is not configured in server environment; simulated dispatch.`
      );
      return { success: true, message: 'SMS service simulated (missing API key).' };
    }

    const credentials = Buffer.from(`${process.env.UNISMS_API_KEY}:`).toString('base64');

    const response = await fetch('https://unismsapi.com/api/sms', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: formattedRecipient,
        content: message,
        sender_id: process.env.UNISMS_SENDER_ID || undefined,
      }),
    });

    if (!response.ok) {
      console.error(
        `${getTimestamp()} [CONFIRMATION SMS] UniSMS gateway rejected dispatch status: ${response.status}`
      );
      return { error: 'SMS delivery gateway rejected message.' };
    }

    console.log(
      `${getTimestamp()} [CONFIRMATION SMS SUCCESS] Dispatched confirmation for Ticket: ${safePatientNum}`
    );
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown dispatch error';
    console.error(`${getTimestamp()} [CONFIRMATION SMS ERROR]:`, errorMsg);
    return { error: 'Failed to process confirmation SMS.' };
  }
}
