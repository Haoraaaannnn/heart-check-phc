/** @fileoverview UTC bounds for a Philippine calendar day, independent of the server timezone. */

/**
 * Computes the half-open UTC interval corresponding to the current day in Manila.
 * @param nowMs - Epoch milliseconds, supplied by the caller for deterministic tests.
 * @returns Inclusive start and exclusive end timestamps for database filters.
 */
export function manilaDayRange(nowMs: number): { start: string; end: string } {
  const offsetMs = 8 * 60 * 60 * 1000;
  const shifted = new Date(nowMs + offsetMs);
  const startMs = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - offsetMs;
  return { start: new Date(startMs).toISOString(), end: new Date(startMs + 86400000).toISOString() };
}
