/**
 * @fileoverview Next.js Server Action for Patient SMS Queue Notifications.
 *
 * Dispatches automated SMS alerts via the UniSMS gateway to notify queued patients
 * when their ticket number is approaching assignment or counter service.
 *
 * Security Considerations (SEC-028 / SEC-AUD-005):
 * - Session Authentication: Enforces active clinical user session check before sending messages.
 * - Regex Phone Validation: Enforces strict Philippine mobile number format (+639XXXXXXXXX or 09XXXXXXXXX).
 * - Rate Limiting: Mitigates toll fraud and SMS quota exhaustion by tracking caller invocation frequency.
 * - Sanitized Output: Hides upstream API keys and gateway response internals.
 *
 * @module app/actions/sendSMS
 */

'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Sliding window rate limiter state stored in-memory per Node process.
 */
interface RateLimitRecord {
  timestamps: number[];
  lastRecipient?: string;
  lastSentAt?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/** Maximum permitted SMS dispatches per user within the rolling window. */
const RATE_LIMIT_MAX_PER_WINDOW = 20;
/** Rolling window duration in milliseconds (60 seconds). */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
/** Minimum cooldown in milliseconds between messages to the same phone number (10 seconds). */
const DUPLICATE_COOLDOWN_MS = 10 * 1000;

/**
 * Validates and normalizes Philippine mobile phone numbers to E.164 (+639XXXXXXXXX) format.
 *
 * @param phone - Raw phone number string.
 * @returns Normalized phone string, or null if invalid format.
 */
function normalizePhilippinePhone(phone: unknown): string | null {
  if (typeof phone !== 'string' && typeof phone !== 'number') return null;
  const cleaned = String(phone).replace(/[\s-]/g, '').trim();

  let normalized = cleaned;
  if (normalized.startsWith('+63')) {
    normalized = normalized.slice(0, 13);
  } else if (normalized.startsWith('63')) {
    normalized = '+' + normalized.slice(0, 12);
  } else if (normalized.startsWith('09')) {
    normalized = '+63' + normalized.slice(1);
  } else {
    return null;
  }

  const PH_MOBILE_REGEX = /^\+639\d{9}$/;
  return PH_MOBILE_REGEX.test(normalized) ? normalized : null;
}

/**
 * Checks and updates rate limits for the calling user.
 *
 * @param userId - Unique identifier of the authenticated staff member.
 * @param recipient - Destination phone number.
 * @returns True if allowed; false if rate limit exceeded.
 */
function checkRateLimit(userId: string, recipient: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let record = rateLimitMap.get(userId);

  if (!record) {
    record = { timestamps: [], lastRecipient: recipient, lastSentAt: now };
    rateLimitMap.set(userId, record);
  }

  // Purge expired timestamps outside the rolling window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  // Check rolling window capacity
  if (record.timestamps.length >= RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      allowed: false,
      reason: 'SMS dispatch rate limit exceeded. Please wait before sending more alerts.',
    };
  }

  // Check duplicate cooldown for identical recipient
  if (record.lastRecipient === recipient && record.lastSentAt && now - record.lastSentAt < DUPLICATE_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: 'Duplicate SMS alert sent too recently to the same recipient.',
    };
  }

  // Record dispatch
  record.timestamps.push(now);
  record.lastRecipient = recipient;
  record.lastSentAt = now;
  return { allowed: true };
}

/**
 * Dispatches an SMS notification to a queued patient.
 *
 * @param phoneNum - Target Philippine mobile number.
 * @param patientNum - Patient queue number identifier.
 * @param cubicleNum - Target service station or counter.
 * @returns Object with operation status or sanitized error message.
 */
export async function sendSMS(phoneNum: string, patientNum: string, cubicleNum: string) {
  try {
    // 1. Enforce session authentication (SEC-028)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[SMS AUTH FAILED] Attempted unauthorized SMS dispatch');
      return { error: 'Unauthorized: Active clinical session required to dispatch SMS.' };
    }

    // 2. Validate destination phone number
    const formattedRecipient = normalizePhilippinePhone(phoneNum);
    if (!formattedRecipient) {
      return {
        error: 'Invalid Philippine phone number format. Must start with 09 or +639 followed by 9 digits.',
      };
    }

    // 3. Enforce rate limiting
    const rateCheck = checkRateLimit(user.id, formattedRecipient);
    if (!rateCheck.allowed) {
      console.warn(`[SMS RATE LIMIT] User ${user.id} throttled: ${rateCheck.reason}`);
      return { error: rateCheck.reason };
    }

    // 4. Sanitize parameters for template interpolation
    const safePatientNum = String(patientNum || '').replace(/[^\w-]/g, '').trim();
    const safeCubicleNum = String(cubicleNum || '').replace(/[^\w\s-]/g, '').trim();

    if (!safePatientNum) {
      return { error: 'Valid patient queue number is required.' };
    }

    const message = `Heart Check PHC: Ang iyong numerong ${safePatientNum} ay susunod na sa ${safeCubicleNum || 'Waiting Area'}, hintayin nalang na matawag ang iyong numero. Salamat!`;

    if (!process.env.UNISMS_API_KEY) {
      console.error('[SMS ERROR] UNISMS_API_KEY is not configured in server environment');
      return { error: 'SMS notification service is currently unavailable.' };
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
        sender_id: process.env.UNISMS_SENDER_ID,
      }),
    });

    if (!response.ok) {
      console.error('[SMS GATEWAY ERROR] UniSMS rejected dispatch:', response.status);
      return { error: 'SMS delivery gateway rejected message.' };
    }

    const result = await response.json().catch(() => ({ success: true }));
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown dispatch error';
    console.error('[SMS UNEXPECTED ERROR]:', message);
    return { error: 'Failed to process SMS notification.' };
  }
}