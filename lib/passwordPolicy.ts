/** @fileoverview Shared password length policy for password-setting routes. */

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

/** @param value - Untrusted password input. @returns Whether it meets the length policy. */
export function isPasswordLengthAllowed(value: unknown): value is string {
  return typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH
}
