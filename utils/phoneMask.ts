/**
 * @fileoverview Client-safe Philippine phone number privacy masking utility (RA 10173).
 *
 * Masks patient contact numbers to prevent shoulder-surfing and protect patient data privacy
 * on all workstation and administrative screens.
 *
 * Example outputs:
 * - "09171234567" -> "0917 •••• 567"
 * - "+639171234567" -> "+63 917 •••• 567"
 * - "enc:v1:..." -> "Protected"
 *
 * @module utils/phoneMask
 */

/**
 * Masks a phone number or encrypted token for privacy-compliant UI presentation.
 *
 * @param raw - Raw phone number, encrypted token, or numeric representation.
 * @param fallback - Fallback string when phone number is absent (default: "None").
 * @returns Masked phone string safe for client screens.
 */
export function maskPhoneDisplay(raw: unknown, fallback = 'None'): string {
  if (raw === null || raw === undefined || raw === '') return fallback;
  const str = String(raw).trim();
  if (!str || str === '0') return fallback;

  // AES-256-GCM encrypted token
  if (str.startsWith('enc:v1:')) {
    return 'Protected';
  }

  // Already masked
  if (str.includes('••••')) {
    return str;
  }

  const digits = str.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)} •••• ${digits.slice(8)}`;
  }

  if (digits.length === 12 && digits.startsWith('639')) {
    return `+63 ${digits.slice(2, 5)} •••• ${digits.slice(9)}`;
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return `0${digits.slice(0, 3)} •••• ${digits.slice(7)}`;
  }

  if (digits.length >= 7) {
    return `${digits.slice(0, 3)} •••• ${digits.slice(-3)}`;
  }

  return '••••';
}
