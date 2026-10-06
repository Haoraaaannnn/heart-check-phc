/**
 * @fileoverview Next.js Server Actions for secure patient phone operations.
 *
 * Exposes server-side encryption, decryption, and privacy masking utilities
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
  decryptPhoneNumber,
  maskPhoneNumber,
  isEncryptedPhone,
} from '@/lib/crypto/phoneEncryption';

/**
 * Server action to encrypt a raw phone number entered at the kiosk.
 *
 * @param plainPhone - Raw phone number entered by the patient.
 * @returns The encrypted ciphertext payload.
 */
export async function encryptPatientPhoneAction(plainPhone: string): Promise<string> {
  if (!plainPhone || typeof plainPhone !== 'string') {
    return '';
  }
  return encryptPhoneNumber(plainPhone);
}

/**
 * Server action to decrypt an encrypted phone payload for authorized operations.
 *
 * @param encryptedOrPlain - Ciphertext or legacy number.
 * @returns Cleartext phone number or null.
 */
export async function decryptPatientPhoneAction(
  encryptedOrPlain: string | number | null | undefined
): Promise<string | null> {
  return decryptPhoneNumber(encryptedOrPlain);
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

export { isEncryptedPhone };
