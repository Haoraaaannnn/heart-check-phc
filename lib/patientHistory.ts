/** @fileoverview Runtime contracts and presentation helpers for PII-free ticket timelines. */

/** Only operational fields may be displayed in a ticket's recorded state. */
export interface HistoryState {
  status?: string | null;
  counter?: number | null;
  cubicleNum?: string | null;
  service?: string | null;
  subcategory?: string | null;
  queue_position?: number | null;
  rotation_count?: number | null;
  reg_start?: string | null;
  reg_end?: string | null;
  consult_start?: string | null;
  consult_end?: string | null;
  carryout_start?: string | null;
  carryout_end?: string | null;
  counter_paused_at?: string | null;
  idle_at?: string | null;
  removed_at?: string | null;
}

/** A committed database event, with the operator's username snapshotted at that time. */
export interface PatientHistoryEvent {
  id: string;
  ticket: string;
  occurred_at: string;
  actor_username: string | null;
  actor_role: string | null;
  actor_kind: string;
  event_type: string;
  from_state: HistoryState | null;
  to_state: HistoryState | null;
}

/** @returns Whether an untrusted value is a named-field object. */
export function historyRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @returns A safe positive database identifier, without rounding large integers. */
export function historyId(value: unknown): string | null {
  const text = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  return typeof text === 'string' && /^[1-9]\d{0,18}$/.test(text) && BigInt(text) <= BigInt('9223372036854775807') ? text : null;
}

/** @returns A validated operational snapshot; unexpected PII fields are discarded. */
function parseState(value: unknown): HistoryState | null | undefined {
  if (value === null) return null;
  if (!historyRecord(value)) return undefined;
  const state: HistoryState = {};
  for (const key of ['status', 'cubicleNum', 'service', 'subcategory', 'reg_start', 'reg_end', 'consult_start',
    'consult_end', 'carryout_start', 'carryout_end', 'counter_paused_at', 'idle_at', 'removed_at'] as const) {
    const item = value[key];
    if (item === undefined) continue;
    if (item !== null && typeof item !== 'string') return undefined;
    if (item && key !== 'status' && key !== 'cubicleNum' && key !== 'service' && key !== 'subcategory'
      && !Number.isFinite(Date.parse(item))) return undefined;
    state[key] = item;
  }
  for (const key of ['counter', 'queue_position', 'rotation_count'] as const) {
    const item = value[key];
    if (item === undefined) continue;
    if (item !== null && (typeof item !== 'number' || !Number.isSafeInteger(item))) return undefined;
    state[key] = item;
  }
  return state;
}

/** @returns Validated events, or null when a response violates the timeline contract. */
export function parseHistoryEvents(value: unknown): PatientHistoryEvent[] | null {
  if (!Array.isArray(value)) return null;
  const events: PatientHistoryEvent[] = [];
  for (const row of value) {
    if (!historyRecord(row)) return null;
    const id = historyId(row.id);
    const before = parseState(row.from_state);
    const after = parseState(row.to_state);
    if (!id || typeof row.ticket !== 'string' || typeof row.occurred_at !== 'string'
      || !Number.isFinite(Date.parse(row.occurred_at)) || before === undefined || after === undefined
      || (before === null && after === null)
      || (row.actor_username !== null && typeof row.actor_username !== 'string')
      || (row.actor_role !== null && typeof row.actor_role !== 'string')
      || typeof row.actor_kind !== 'string' || typeof row.event_type !== 'string') return null;
    events.push({ id, ticket: row.ticket, occurred_at: row.occurred_at, actor_username: row.actor_username,
      actor_role: row.actor_role, actor_kind: row.actor_kind, event_type: row.event_type, from_state: before, to_state: after });
  }
  return events;
}

/** @returns The operational location at this step, including the registration/clinical distinction. */
export function historyLocation(state: HistoryState | null): string {
  if (!state) return 'Outside queue';
  if (state.cubicleNum) return state.cubicleNum;
  if (state.counter != null && !state.reg_end) return `Counter ${state.counter}`;
  if (state.status === 'Idle') return 'Idle queue';
  if (state.status === 'Removed') return 'Removed from queue';
  if (state.status === 'Done') return 'Completed';
  return state.reg_end ? 'Transfer queue' : 'Waiting queue';
}

/** @returns A clear identity label without inventing an operator for legacy or automatic actions. */
export function historyActor(event: PatientHistoryEvent): string {
  if (event.actor_kind === 'baseline') return 'Recording started';
  if (event.actor_kind === 'automation') return event.actor_username ? `Automatic queue action · workstation: ${event.actor_username}` : 'Automatic queue action';
  if (event.actor_username) return event.actor_username;
  if (event.actor_kind === 'kiosk') return 'Kiosk check-in';
  if (event.actor_kind === 'system') return 'System';
  return 'Operator not recorded';
}

/** @returns A human-readable description of a committed ticket event. */
export function historyAction(event: PatientHistoryEvent): string {
  const labels: Record<string, string> = { created: 'Ticket created', baseline: 'Starting point', rotation: 'Queue rotated',
    pause: 'Timer paused', resume: 'Timer resumed', call: 'Patient called', deleted: 'Ticket deleted' };
  if (labels[event.event_type]) return labels[event.event_type];
  if (event.to_state?.status === 'Removed') return 'Removed from queue';
  if (event.to_state?.status === 'Done') return 'Care completed';
  return event.from_state?.status !== event.to_state?.status ? 'Stage changed' : 'Queue updated';
}

/** @returns Changed operational clocks, including cleared timestamps on back/reactivation actions. */
export function historyTimingChanges(event: PatientHistoryEvent): { label: string; from: string | null; to: string | null }[] {
  if (!event.from_state || !event.to_state) return [];
  const labels = { reg_start: 'Registration started', reg_end: 'Registration completed', consult_start: 'Consultation started',
    consult_end: 'Consultation completed', carryout_start: 'Carryout started', carryout_end: 'Carryout completed',
    counter_paused_at: 'Timer paused', idle_at: 'Entered idle queue', removed_at: 'Removed from queue' };
  const changes: { label: string; from: string | null; to: string | null }[] = [];
  for (const key of ['reg_start', 'reg_end', 'consult_start', 'consult_end', 'carryout_start', 'carryout_end', 'counter_paused_at', 'idle_at', 'removed_at'] as const) {
    const from = event.from_state[key] ?? null;
    const to = event.to_state[key] ?? null;
    if (from !== to) changes.push({ label: labels[key], from, to });
  }
  return changes;
}
