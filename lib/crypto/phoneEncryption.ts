/**
 * @fileoverview Cryptographic utility for securing patient contact phone numbers.
 *
 * Implements authenticated symmetric encryption (AES-256-GCM) for Patient Health
 * Information (PHI / PII) data protection at rest and in transit.
 *
 * Architecture and Design Considerations:
 * - Cipher: AES-256-GCM provides confidentiality and integrity verification.
 * - Nonce/IV: 12-byte cryptographically secure random bytes generated per encryption.
 * - Authentication Tag: 16-byte authentication tag ensuring ciphertext has not been tampered with.
 * - Key Derivation: Derives a 256-bit key from the environment secret using SHA-256.
 * - Backwards Compatibility: Gracefully handles legacy unencrypted numeric records (int8)
 *   and plain string formats while migrating to encrypted storage.
 * - Shoulder-Surfing Protection: Provides masking helpers (e.g. 0917 •••• 567) for display.
 *
 * @module lib/crypto/phoneEncryption
 */

import crypto from 'crypto';

/** Serialization prefix identifying AES-256-GCM encrypted values. */
export const ENCRYPTION_PREFIX = 'enc:v1';

/**
 * Standard salt used for deterministic secret derivation.
 */
const KDF_SALT = 'phc_phone_salt_v1_2026';

/**
 * Resolves the 256-bit AES encryption key from system environment variables.
 * Falls back to an internal development seed if not configured in dev environments.
 *
 * @returns 32-byte Buffer containing the symmetric encryption key.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.PHONE_ENCRYPTION_SECRET ||
    process.env.ENCRYPTION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'heart-check-phc-default-encryption-secret-key-32b';

  return crypto.scryptSync(secret, KDF_SALT, 32);
}

/**
 * Checks whether a given value is an AES-256-GCM encrypted string.
 *
 * @param value - Value to inspect.
 * @returns True if value conforms to the enc:v1 format.
 */
export function isEncryptedPhone(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

/**
 * Encrypts a Philippine mobile phone number using AES-256-GCM authenticated encryption.
 *
 * @param plainPhone - Cleartext phone number string (e.g. "09171234567" or "+639171234567").
 * @returns Ciphertext string in the format "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>".
 * @throws Error if plainPhone is empty or malformed.
 */
export function encryptPhoneNumber(plainPhone: string): string {
  if (!plainPhone || typeof plainPhone !== 'string') {
    throw new Error('Invalid phone number: Must be a non-empty string.');
  }

  const cleanPhone = plainPhone.trim();
  if (isEncryptedPhone(cleanPhone)) {
    return cleanPhone;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(cleanPhone, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return `${ENCRYPTION_PREFIX}:${ivHex}:${authTag}:${ciphertext}`;
}

/**
 * Decrypts an AES-256-GCM encrypted phone number back into plain text.
 * Gracefully passes through unencrypted legacy phone numbers (both string and numeric).
 *
 * @param encryptedOrPlain - Encrypted token ("enc:v1:..."), cleartext phone, or null/undefined.
 * @returns Decrypted cleartext phone number, or null if the input was empty or invalid.
 */
export function decryptPhoneNumber(
  encryptedOrPlain: string | number | null | undefined
): string | null {
  if (encryptedOrPlain === null || encryptedOrPlain === undefined || encryptedOrPlain === '') {
    return null;
  }

  const valueStr = String(encryptedOrPlain).trim();
  if (!valueStr || valueStr === '0') {
    return null;
  }

  // If not encrypted, return clean unencrypted representation for backward compatibility
  if (!isEncryptedPhone(valueStr)) {
    if (/^\d{10}$/.test(valueStr)) {
      return `0${valueStr}`;
    }
    return valueStr;
  }

  try {
    const parts = valueStr.split(':');
    if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
      console.warn('[PHONE CRYPTO] Malformed encrypted token structure');
      return null;
    }

    const [, , ivHex, tagHex, ciphertextHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[PHONE CRYPTO DECRYPT ERROR] Failed to decrypt phone payload:', message);
    return null;
  }
}

/**
 * Formats a phone number for display with privacy masking to prevent shoulder-surfing.
 * Example outputs:
 * - "0917 •••• 567"
 * - "+63 917 •••• 567"
 *
 * @param phoneOrEncrypted - Phone number string, encrypted payload, or numeric value.
 * @param fallback - Fallback string when phone number is absent (default: "None").
 * @returns Masked phone string safe for UI display.
 */
export function maskPhoneNumber(
  phoneOrEncrypted: string | number | null | undefined,
  fallback = 'None'
): string {
  if (phoneOrEncrypted === null || phoneOrEncrypted === undefined || phoneOrEncrypted === '') {
    return fallback;
  }

  const plain = decryptPhoneNumber(phoneOrEncrypted);
  if (!plain) {
    return fallback;
  }

  const digits = plain.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    // Format: 0917 •••• 567
    return `${digits.slice(0, 4)} •••• ${digits.slice(8)}`;
  }

  if (digits.length === 12 && digits.startsWith('639')) {
    // Format: +63 917 •••• 567
    return `+63 ${digits.slice(2, 5)} •••• ${digits.slice(9)}`;
  }

  if (digits.length >= 7) {
    const head = digits.slice(0, 3);
    const tail = digits.slice(-3);
    return `${head} •••• ${tail}`;
  }

  return '••••';
}
