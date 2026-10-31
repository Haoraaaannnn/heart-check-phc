/** @fileoverview Server-authorized registration balancing through the existing atomic handoff function. */
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import { manilaDayRange } from '@/utils/manilaDayRange';

/** Acknowledged moves are reported separately from rejected or concurrent changes. */
type DistributionResult = { ok: true; redistributedCount: number; affectedPatientIds: number[] }
  | { ok: false; error: string; status: 403 | 409 | 503 };
/** Minimal queue snapshot; no patient contact or name is read. */
interface Ticket { id: number; counter: number; service: string; counter_top_started_at: string | null }
/** Open, staffed destination and its explicitly assigned services. */
interface Destination { counter: number; services: Set<string> }
const STAFF_ROLES = new Set(['superadmin', 'admin', 'registration', 'staff', 'nurse']);

/** @returns Runtime-checked database records. */
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
/** @returns Only object rows from an external response. */
function rows(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter(record) : []; }
/** @returns A service key matching the existing handoff function's OPD aliases. */
function serviceKey(value: string): string {
  const label = value.trim().toLowerCase();
  return label === 'opd' ? 'opd screening' : label;
}
/** @returns Staff-owned counters only, excluding inactive and paused destinations. */
function destinations(options: { counters: unknown; owners: unknown; services: unknown }): Destination[] {
  const result: Destination[] = [];
  for (const counter of rows(options.counters)) {
    if (typeof counter.counter_number !== 'number' || counter.active !== true || counter.on_break !== false) continue;
    const owners = rows(options.owners).filter(owner => owner.counter === counter.counter_number);
    const services = rows(options.services).filter(link => owners.some(owner => owner.user_id === link.user_id))
      .map(link => link.service).filter((value): value is string => typeof value === 'string');
    if (services.length) result.push({ counter: counter.counter_number, services: new Set(services.map(serviceKey)) });
  }
  return result.sort((first, second) => first.counter - second.counter);
}
/** @returns Valid live intake snapshots without assuming SDK field types. */
function tickets(value: unknown): Ticket[] {
  return rows(value).flatMap(row => typeof row.id === 'number' && Number.isSafeInteger(row.id) && typeof row.counter === 'number'
    && typeof row.service === 'string' && (row.counter_top_started_at === null || typeof row.counter_top_started_at === 'string')
    ? [{ id: row.id, counter: row.counter, service: row.service, counter_top_started_at: row.counter_top_started_at }] : []);
}

/**
 * Resolves balancing scope exclusively from the verified account and its database permissions.
 * @param options - Server-verified identity and optional requested service names.
 * @returns The allowed service filter or an explicit authorization failure.
 */
async function allowedServices(options: { actorAuthId: string; targetServices?: string[] }) {
  const profile = await supabaseAdmin.from('users').select('id,role').eq('auth_id', options.actorAuthId).maybeSingle();
  if (profile.error) return { ok: false, error: 'Unable to verify sorting permissions.', status: 503 } as const;
  const user: unknown = profile.data;
  if (!record(user) || typeof user.role !== 'string' || !STAFF_ROLES.has(user.role)
    || (typeof user.id !== 'number' && typeof user.id !== 'string')) return { ok: false, error: 'Staff authorization required.', status: 403 } as const;
  if (user.role === 'admin' || user.role === 'superadmin') return { ok: true, services: options.targetServices } as const;
  const links = await supabaseAdmin.from('user_services').select('service').eq('user_id', user.id);
  if (links.error) return { ok: false, error: 'Unable to verify sorting permissions.', status: 503 } as const;
  const services = rows(links.data).map(link => link.service).filter((value): value is string => typeof value === 'string');
  if (!services.length || options.targetServices?.some(service => !services.some(allowed => serviceKey(allowed) === serviceKey(service)))) {
    return { ok: false, error: 'This service is outside your assigned counters.', status: 403 } as const;
  }
  return { ok: true, services: options.targetServices ?? services } as const;
}

/**
 * Balances waiting tickets while leaving already-started registration tickets in place.
 * @param options - Verified initiating account; the request body cannot supply another operator.
 * @returns Counts only acknowledged moves, or a retryable failure when the snapshot changes.
 * @remarks Each handoff rechecks live status, historical exclusion, ownership, service and break state in PostgreSQL.
 */
export async function equallyDistributeCounterQueues(options: { actorAuthId: string; targetServices?: string[] }): Promise<DistributionResult> {
  const scope = await allowedServices(options);
  if (!scope.ok) return scope;
  const day = manilaDayRange(Date.now());
  let query = supabaseAdmin.from('patients').select('id,counter,service,counter_top_started_at')
    .eq('is_historical', false).in('status', ['Waiting', 'On Progress']).is('reg_end', null).is('cubicleNum', null)
    .not('counter', 'is', null).gte('created_at', day.start).lt('created_at', day.end).order('created_at', { ascending: true });
  if (scope.services) query = query.in('service', scope.services);
  const [patients, counters, owners, services] = await Promise.all([query,
    supabaseAdmin.from('counters').select('counter_number,active,on_break').eq('active', true).eq('on_break', false),
    supabaseAdmin.from('user_counters').select('user_id,counter'), supabaseAdmin.from('user_services').select('user_id,service')]);
  if ([patients, counters, owners, services].some(result => result.error)) return { ok: false, error: 'Unable to read the current counter queues.', status: 503 };
  const open = destinations({ counters: counters.data, owners: owners.data, services: services.data });
  const waiting = tickets(patients.data);
  const loads = new Map(open.map(counter => [counter.counter, waiting.filter(ticket => ticket.counter === counter.counter && ticket.counter_top_started_at).length]));
  const affectedPatientIds: number[] = [];
  for (const ticket of waiting.filter(item => !item.counter_top_started_at)) {
    const eligible = open.filter(counter => counter.services.has(serviceKey(ticket.service)))
      .sort((first, second) => (loads.get(first.counter) ?? 0) - (loads.get(second.counter) ?? 0)
        || Number(second.counter === ticket.counter) - Number(first.counter === ticket.counter) || first.counter - second.counter);
    const target = eligible[0];
    if (!target) continue;
    if (target.counter !== ticket.counter) {
      const moved = await supabaseAdmin.rpc('move_registration_ticket', { caller_auth_id: options.actorAuthId,
        patient_id: ticket.id, source_counter: ticket.counter, destination_counter: target.counter }).setHeader('x-hc-actor-id', options.actorAuthId);
      if (moved.error || moved.data !== true) return { ok: false, error: 'The queues changed while sorting. Refresh to see completed moves and try again.', status: 409 };
      affectedPatientIds.push(ticket.id);
    }
    loads.set(target.counter, (loads.get(target.counter) ?? 0) + 1);
  }
  return { ok: true, redistributedCount: affectedPatientIds.length, affectedPatientIds };
}
