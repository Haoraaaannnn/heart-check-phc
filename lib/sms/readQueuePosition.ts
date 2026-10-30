/** @fileoverview Server-only, read-only queue snapshots for existing SMS dispatches. */
import { createAdminClient } from '@/lib/supabase/admin';
import { manilaDayRange } from '@/utils/manilaDayRange';
import { rankSmsQueue, SmsQueueEntry, SmsQueuePosition } from '@/lib/sms/queuePosition';

/** Position failures remain explicit while callers may keep the original message without a rank. */
type PositionResult = { ok: true; position: SmsQueuePosition | null } | { ok: false; error: string };
const QUEUE_FIELDS = 'id,status,counter,cubicleNum,reg_end,called_at,created_at,counter_rejoin_at,queue_position';

/** @param value - External record. @returns Whether named fields may be read as unknown values. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param value - External timestamp. @returns Whether it is a valid nullable timestamp. */
function isTimestamp(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)));
}

/** @param value - Untrusted database row. @returns A validated minimal queue row or null. */
function parseEntry(value: unknown): SmsQueueEntry | null {
  if (!isRecord(value)) return null;
  const row = value;
  const id: unknown = row.id; const status: unknown = row.status; const counter: unknown = row.counter;
  const cubicleNum: unknown = row.cubicleNum; const regEnd: unknown = row.reg_end; const calledAt: unknown = row.called_at;
  const createdAt: unknown = row.created_at; const rejoinAt: unknown = row.counter_rejoin_at; const queuePosition: unknown = row.queue_position;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || typeof status !== 'string' ||
      !(counter === null || (typeof counter === 'number' && Number.isSafeInteger(counter) && counter > 0)) ||
      !(cubicleNum === null || typeof cubicleNum === 'string') || !isTimestamp(regEnd) || !isTimestamp(calledAt) ||
      typeof createdAt !== 'string' || !isTimestamp(createdAt) || !isTimestamp(rejoinAt) ||
      !(queuePosition === null || (typeof queuePosition === 'number' && Number.isSafeInteger(queuePosition)))) return null;
  return { id, status, counter, cubicleNum, reg_end: regEnd, called_at: calledAt,
    created_at: createdAt, counter_rejoin_at: rejoinAt, queue_position: queuePosition };
}

/**
 * Reads today's live ticket and roster without changing assignments, timers or notification timing.
 * @param options - Ticket number and injected dispatch time.
 * @returns A verified station position or an explicit unavailable outcome.
 */
export async function readSmsQueuePosition(options: { patientId: number; patientNum: string; nowMs: number }): Promise<PositionResult> {
  try {
    if (!Number.isSafeInteger(options.patientId) || options.patientId < 1) return { ok: false, error: 'Queue ticket identity could not be verified.' };
    const client = createAdminClient();
    const { start, end } = manilaDayRange(options.nowMs);
    const { data, error } = await client.from('patients').select(QUEUE_FIELDS).eq('id', options.patientId).eq('patientNum', options.patientNum)
      .eq('is_historical', false).gte('created_at', start).lt('created_at', end)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return { ok: false, error: 'Queue position could not be verified.' };
    if (!data) return { ok: true, position: null };
    const target = parseEntry(data);
    if (!target) return { ok: false, error: 'Queue position response was invalid.' };
    const atCounter = target.counter !== null && target.reg_end === null && ['Waiting', 'On Progress'].includes(target.status);
    if (!atCounter && (!target.cubicleNum || target.status !== 'Assigned')) return { ok: true, position: null };
    let query = client.from('patients').select(QUEUE_FIELDS, { count: 'exact' }).eq('is_historical', false).gte('created_at', start).lt('created_at', end);
    query = atCounter ? query.eq('counter', target.counter).is('reg_end', null).in('status', ['Waiting', 'On Progress'])
      : query.eq('cubicleNum', target.cubicleNum).eq('status', 'Assigned');
    const { data: roster, error: rosterError, count: rosterCount } = await query;
    const values: unknown = roster;
    if (rosterError || !Array.isArray(values) || rosterCount !== values.length) return { ok: false, error: 'Queue position could not be verified.' };
    const rows = values.map(parseEntry);
    if (rows.some(row => row === null)) return { ok: false, error: 'Queue position response was invalid.' };
    return { ok: true, position: rankSmsQueue({ target, rows: rows.filter((row): row is SmsQueueEntry => row !== null) }) };
  } catch { return { ok: false, error: 'Queue position is temporarily unavailable.' }; }
}
