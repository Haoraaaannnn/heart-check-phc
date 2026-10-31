/** @fileoverview Bounded, minimal-field kiosk physician roster reads with concurrent station discovery. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActualCubicle, CubicleSelectorType } from '@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType';

/** @returns Whether an external row is a named-field record. */
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/** @returns Validated rows without trusting Supabase's inferred response shape. */
function rows(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter(record) : []; }
/** @returns A normalized database identity, accepting both numeric and UUID-backed directories. */
function identity(value: unknown): string | null {
  return typeof value === 'string' ? value : typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : null;
}
/** @returns A stable station key used only to resolve legacy selector links. */
function stationKey(value: string) { return value.replace(/^cubicle\s*/i, '').trim().toLowerCase(); }

/** @returns A validated station within the requested service and age category. */
function parseStation(options: { value: unknown; service: string; subcategory?: string }): ActualCubicle | null {
  const { value, service, subcategory } = options;
  if (!record(value) || typeof value.cubicleNum !== 'string' || !value.cubicleNum.trim()
    || value.category !== service || (subcategory && value.subcategory !== subcategory)
    || (value.subcategory != null && typeof value.subcategory !== 'string')) return null;
  return { cubicleNum: value.cubicleNum, category: service, subcategory: value.subcategory ?? null, doctorId: identity(value.doctorId) };
}

/** @returns Selector options with only valid, currently named physician stations attached. */
function enrichOptions(options: { selectors: unknown; stations: ActualCubicle[]; names: Map<string, string>; service: string; subcategory?: string }) {
  const result: CubicleSelectorType[] = [];
  for (const row of rows(options.selectors)) {
    if (typeof row.id !== 'number' || typeof row.cubicle_name !== 'string' || typeof row.cubicle_order !== 'number') continue;
    const selectorName = row.cubicle_name;
    const linked = rows(row.cubicles).map(link => parseStation({ value: link.cubicle, service: options.service, subcategory: options.subcategory }))
      .filter((station): station is ActualCubicle => station !== null);
    const fallback = options.stations.find(station => stationKey(station.cubicleNum) === stationKey(selectorName));
    const stations = linked.length ? linked : fallback ? [fallback] : [];
    const named = stations.map(station => {
      const direct = options.stations.find(candidate => candidate.cubicleNum === station.cubicleNum);
      const doctorId = station.doctorId ?? direct?.doctorId ?? null;
      return { ...station, doctorId, doctorName: doctorId ? options.names.get(doctorId) ?? null : null };
    }).filter(station => Boolean(station.doctorName));
    if (!named.length) continue;
    result.push({ id: row.id, cubicle_name: row.cubicle_name, cubicle_order: row.cubicle_order,
      cubicles: named.map(cubicle => ({ cubicle })), doctorName: [...new Set(named.map(station => station.doctorName))].join(', ') });
  }
  return result;
}

/**
 * Reads the station lists together, then resolves assigned active doctors once on the server.
 * @param options - Public roster client, server-only physician client and one deadline for the whole read.
 * @returns Sanitized physician options; failures never masquerade as an empty successful roster.
 */
export async function loadDoctorOptions(options: {
  db: SupabaseClient; directory: SupabaseClient; service: string; subcategory?: string; signal: AbortSignal;
}): Promise<CubicleSelectorType[]> {
  const [selectors, direct] = await Promise.all([
    options.db.from('cubicle_selector').select('id,cubicle_name,cubicle_order,cubicles:cubicle_selector_cubicle(cubicle:cubicle!cubicle_selector_cubicle_cubicle_id_fkey(cubicleNum,category,subcategory,doctorId))')
      .order('cubicle_order', { ascending: true }).abortSignal(options.signal),
    options.db.from('cubicle').select('cubicleNum,category,subcategory,doctorId').eq('category', options.service).abortSignal(options.signal),
  ]);
  if (selectors.error || direct.error) throw new Error('Unable to load the doctor choices. Please try again.');
  const stations = rows(direct.data).map(value => parseStation({ value, service: options.service, subcategory: options.subcategory }))
    .filter((station): station is ActualCubicle => station !== null);
  const linked = rows(selectors.data).flatMap(selector => rows(selector.cubicles).map(link =>
    parseStation({ value: link.cubicle, service: options.service, subcategory: options.subcategory }))).filter((station): station is ActualCubicle => station !== null);
  const ids = [...new Set([...stations, ...linked].map(station => station.doctorId).filter((id): id is string => id !== null && id !== undefined))];
  if (!ids.length) return [];
  const doctors = await options.directory.from('doctors').select('id,full_name').in('id', ids).eq('active', true).abortSignal(options.signal);
  if (doctors.error) throw new Error('Unable to load the doctor choices. Please try again.');
  const names = new Map<string, string>();
  for (const doctor of rows(doctors.data)) {
    const id = identity(doctor.id);
    if (id && typeof doctor.full_name === 'string' && doctor.full_name.trim()) names.set(id, doctor.full_name.trim());
  }
  return enrichOptions({ selectors: selectors.data, stations, names, service: options.service, subcategory: options.subcategory });
}
