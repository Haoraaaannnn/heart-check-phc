/** @fileoverview Shared staff inactivity policy and cross-tab activity clock. */
export const SESSION_POLICY = { key: 'staff_session_idle_minutes', defaultMinutes: 20, minMinutes: 5, maxMinutes: 720 } as const;
export const SESSION_POLICY_EVENT = 'phc:session-policy-updated';
export const SESSION_POLICY_STORAGE = 'phc:staff-session-policy';

/**
 * Validates an administrator's inactivity duration without accepting partial numeric strings.
 * @param value - Stored or entered duration in minutes.
 * @returns A whole number within the supported range, or null.
 */
export function parseSessionMinutes(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= SESSION_POLICY.minMinutes && minutes <= SESSION_POLICY.maxMinutes ? minutes : null;
}

/**
 * Gets a stable session identifier across token refreshes without storing authentication tokens.
 * @param token - The already-authenticated session's access token.
 * @param userId - Fallback identity for older token formats.
 * @returns A local activity-storage identifier; never used for authorization.
 */
export function sessionActivityKey(token: string, userId: string): string {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    if (typeof payload.session_id === 'string' && /^[a-zA-Z0-9-]{1,128}$/.test(payload.session_id)) {
      return `phc:staff-activity:${userId}:${payload.session_id}`;
    }
  } catch { /* Older sessions still share activity by verified user identity. */ }
  return `phc:staff-activity:${userId}`;
}

/** Minimal browser storage contract for activity synchronization and isolated tests. */
export interface ActivityStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

/** Monotonic activity shared by same-session staff tabs, with a memory fallback for restricted storage. */
export class SessionActivityClock {
  private lastActive: number;

  /**
   * Preserves the previous activity timestamp when a tab is duplicated or refreshed.
   * @param storage - Browser local storage, or null when unavailable.
   * @param key - Verified session's local activity key.
   * @param now - Current epoch time.
   */
  constructor(private storage: ActivityStorage | null, readonly key: string, now: number) {
    this.lastActive = 0;
    if (!this.read(now)) { this.lastActive = now; this.write(); }
  }

  /** Reads activity from all tabs without accepting future timestamps or moving backward. */
  private read(now: number): number {
    try {
      const value = Number(this.storage?.getItem(this.key));
      if (Number.isFinite(value) && value > 0 && value <= now) this.lastActive = Math.max(this.lastActive, value);
    } catch { /* Continue with in-memory activity when storage is blocked. */ }
    return this.lastActive;
  }

  /** Writes only non-sensitive activity metadata; authentication remains in Supabase cookies. */
  private write(): void {
    try { this.storage?.setItem(this.key, String(this.lastActive)); } catch { /* Storage may be disabled. */ }
  }

  /**
   * Returns the time before inactivity expiry using the newest activity from any staff tab.
   * @param minutes - Validated inactivity duration.
   * @param now - Current epoch time.
   * @returns Nonnegative remaining milliseconds.
   */
  remaining(minutes: number, now: number): number { return Math.max(0, this.read(now) + minutes * 60000 - now); }

  /**
   * Records deliberate activity while preserving an already-expired session's deadline.
   * @param minutes - Validated inactivity duration.
   * @param now - Current epoch time.
   * @returns False when login is required, otherwise true.
   */
  record(minutes: number, now: number): boolean {
    if (this.remaining(minutes, now) === 0) return false;
    this.lastActive = now;
    this.write();
    return true;
  }
}
