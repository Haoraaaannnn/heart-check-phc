/** @fileoverview Server-owned physician editing scope for nurse station assignments. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { isDoctorRecord } from './contracts';

/** @param value - External collection. @returns Checked rows or an explicit invalid-response error. */
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every(isDoctorRecord)) throw new Error('Station access could not be verified.');
  return value;
}

/**
 * Computes nurse station scope from the same explicit cubicle, service and room assignments as clinical actions.
 * @param options - Server database client, user identity, role and current station rows.
 * @returns Allowed cubicle IDs; administrators may manage all configured stations.
 */
export async function editableDoctorStations(options: {
  db: SupabaseClient; userId: string | number; role: string; cubicles: Record<string, unknown>[];
}): Promise<number[]> {
  const { db, userId, role, cubicles } = options;
  const stationIds = (stations: Record<string, unknown>[]) => stations.flatMap(station =>
    typeof station.id === 'number' && Number.isSafeInteger(station.id) ? [station.id] : []);
  if (['superadmin', 'admin'].includes(role)) return stationIds(cubicles);
  if (role !== 'nurse') return [];
  const [links, services, rooms] = await Promise.all([
    db.from('user_cubicles').select('cubicle_id').eq('user_id', userId),
    db.from('user_services').select('service').eq('user_id', userId),
    db.from('user_rooms').select('service,subcategory,room').eq('user_id', userId),
  ]);
  if (links.error || services.error || rooms.error) throw new Error('Nurse station access could not be verified.');
  const explicit = rows(links.data); const allowedServices = rows(services.data); const allowedRooms = rows(rooms.data);
  return stationIds(cubicles.filter(station => explicit.length > 0
    ? explicit.some(link => link.cubicle_id === station.id)
    : allowedServices.some(link => link.service === station.category) || allowedRooms.some(room =>
      room.service === station.category && room.room === station.room &&
      (room.subcategory == null || room.subcategory === station.subcategory))));
}
