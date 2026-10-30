/** @fileoverview Deterministic rotation limit and idle transition fields. */

/**
 * Computes cumulative rotations without morning/afternoon resets.
 * @param options - Persisted count and the administrator's configured limit.
 * @returns The next count and whether the ticket enters the recoverable idle pool.
 */
export function nextIdleRotation(options: { rotationCount?: number | null; maxRotations: number }) {
  const rotationCount = (options.rotationCount ?? 0) + 1;
  return { rotationCount, idle: rotationCount >= options.maxRotations };
}

/**
 * Releases station and timer state when a ticket reaches the idle limit.
 * @param nowIso - Injected transition timestamp.
 * @returns Fields shared by registration and clinical idle transitions.
 */
export function idlePatientFields(nowIso: string) {
  return { status: 'Idle', idle_at: nowIso, removed_at: null, queue_position: null,
    counter: null, cubicleNum: null, called_at: null, progress_started_at: null,
    cubicle_top_started_at: null, counter_top_started_at: null, counter_rejoin_at: null,
    counter_paused_at: null, cooldown_until: null };
}
