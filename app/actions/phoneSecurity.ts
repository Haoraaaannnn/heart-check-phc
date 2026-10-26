/**
 * @fileoverview Next.js Server Actions for secure patient phone operations.
 *
 * Exposes server-side encryption and privacy masking utilities
 * to frontend components while keeping encryption keys strictly isolated on the server.
 *
 * Security Considerations:
 * - Principle of Least Privilege: Keys never sent to browser bundles.
 * - Input Validation: Verifies phone length and character set before encryption.
 *
 * @module app/actions/phoneSecurity
 */

'use server';

import {
  encryptPhoneNumber,
  maskPhoneNumber,
} from '@/lib/crypto/phoneEncryption';

/**
 * Server action to encrypt a raw phone number entered at the kiosk.
 *
 * @param plainPhone - Raw phone number entered by the patient.
 * @returns The encrypted ciphertext payload.
 */
export async function encryptPatientPhoneAction(plainPhone: string): Promise<string> {
  if (typeof plainPhone !== 'string' || !/^09\d{9}$/.test(plainPhone.trim())) throw new Error('A valid Philippine mobile number is required.');
  return encryptPhoneNumber(plainPhone);
}

/**
 * Server action to format an encrypted or raw phone number into a privacy-masked representation.
 *
 * @param phoneOrEncrypted - Phone string or encrypted payload.
 * @param fallback - Fallback label when phone is empty.
 * @returns Masked phone string.
 */
export async function maskPatientPhoneAction(
  phoneOrEncrypted: string | number | null | undefined,
  fallback?: string
): Promise<string> {
  return maskPhoneNumber(phoneOrEncrypted, fallback);
}
