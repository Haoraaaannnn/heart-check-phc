/** @fileoverview Pure morning/afternoon rotation rules using Manila time. */

/** Five rotations are allowed; the sixth cancels the ticket. */
export const MAX_SHIFT_ROTATIONS = 5;

/**
 * Finds the active shift boundary independent of the device timezone.
 * @param nowMs - Injected current time in milliseconds.
 * @returns Midnight or 1 PM Manila as an ISO timestamp.
 */
export function rotationShiftStart(nowMs: number): string {
  const manila = new Date(nowMs + 8 * 60 * 60 * 1000);
  const hour = manila.getUTCHours() >= 13 ? 13 : 0;
  return new Date(Date.UTC(manila.getUTCFullYear(), manila.getUTCMonth(), manila.getUTCDate(), hour - 8)).toISOString();
}

/**
 * Computes the next count, resetting carried tickets on entering a new shift.
 * @param options - Persisted rotation state and injected clock.
 * @returns Next count and whether the ticket exceeds five rotations.
 */
export function nextShiftRotation(options: { rotationCount?: number | null; shiftStartedAt?: string | null; nowMs: number }) {
  const shiftStartedAt = rotationShiftStart(options.nowMs);
  const sameShift = options.shiftStartedAt != null && Date.parse(options.shiftStartedAt) === Date.parse(shiftStartedAt);
  const rotationCount = (sameShift ? options.rotationCount ?? 0 : 0) + 1;
  return { rotationCount, shiftStartedAt, cancelled: rotationCount > MAX_SHIFT_ROTATIONS };
}
