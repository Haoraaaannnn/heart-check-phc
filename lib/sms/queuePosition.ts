/** @fileoverview Pure queue-position wording and ordering for SMS snapshots. */

/** Minimal live queue fields, without contact numbers or patient names. */
export interface SmsQueueEntry {
  id: number;
  status: string;
  counter: number | null;
  cubicleNum: string | null;
  reg_end: string | null;
  called_at: string | null;
  created_at: string;
  counter_rejoin_at: string | null;
  queue_position: number | null;
}

/** Current one-based position at a specific assigned station. */
export interface SmsQueuePosition { position: number; aheadCount: number; destination: string }

/** @param value - Queue timestamp. @returns Its epoch value, or zero for an unset timestamp. */
function timestampMs(value: string | null): number { return value === null ? 0 : Date.parse(value); }

/**
 * Ranks only the assigned station, following counter rejoin order or cubicle call order.
 * @param options - Current target ticket and a fresh station roster.
 * @returns A position snapshot, or null when the target is no longer waiting at this station.
 */
export function rankSmsQueue(options: { target: SmsQueueEntry; rows: SmsQueueEntry[] }): SmsQueuePosition | null {
  const { target } = options;
  const atCounter = target.counter !== null && target.reg_end === null && ['Waiting', 'On Progress'].includes(target.status);
  const atCubicle = Boolean(target.cubicleNum) && target.status === 'Assigned';
  if (!atCounter && !atCubicle) return null;
  const roster = options.rows.filter(row => atCounter
    ? row.counter === target.counter && row.reg_end === null && ['Waiting', 'On Progress'].includes(row.status)
    : row.cubicleNum === target.cubicleNum && row.status === 'Assigned');
  roster.sort((first, second) => {
    const firstMs = atCounter ? timestampMs(first.counter_rejoin_at ?? first.created_at) : timestampMs(first.called_at);
    const secondMs = atCounter ? timestampMs(second.counter_rejoin_at ?? second.created_at) : timestampMs(second.called_at);
    const positionDifference = atCounter ? 0 : (first.queue_position ?? Infinity) - (second.queue_position ?? Infinity);
    return firstMs - secondMs || positionDifference || timestampMs(first.created_at) - timestampMs(second.created_at) || first.id - second.id;
  });
  const index = roster.findIndex(row => row.id === target.id);
  if (index < 0) return null;
  return { position: index + 1, aheadCount: index, destination: atCounter ? `Counter ${target.counter}` : target.cubicleNum ?? '' };
}

/**
 * Formats an accurate ordinal including 11th, 12th, 13th and subsequent queue positions.
 * @param snapshot - Position at dispatch time, or null when not verified.
 * @returns One short message line, or an empty string rather than an invented position.
 */
export function smsQueuePositionText(snapshot: SmsQueuePosition | null): string {
  if (!snapshot || !Number.isSafeInteger(snapshot.position) || snapshot.position < 1) return '';
  const position = snapshot.position;
  const suffix = position % 100 >= 11 && position % 100 <= 13 ? 'th'
    : position % 10 === 1 ? 'st' : position % 10 === 2 ? 'nd' : position % 10 === 3 ? 'rd' : 'th';
  const destination = snapshot.destination.replace(/[^\w\s-]/g, '').trim();
  if (!destination) return '';
  return `You are ${position}${suffix} in line at ${destination} (${position - 1} ahead).`;
}
