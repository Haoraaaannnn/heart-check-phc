/** @fileoverview Server-side history access follows current clinical ownership and intake assignments. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { historyRecord } from '@/lib/patientHistory';

/** @returns Runtime-validated rows from an external database response. */
function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(historyRecord) : [];
}

/**
 * Checks live ticket ownership; broad dashboard access is reserved for administrators.
 * @param options - Verified profile, authentication identity, patient, and server database.
 * @returns Permission, or null when assignments could not be verified.
 */
export async function canReadPatientHistory(options: {
  db: SupabaseClient; userId: string | number; authId: string; role: string; patient: Record<string, unknown> | null;
}): Promise<boolean | null> {
  const { db, userId, authId, role, patient } = options;
  if (role === 'superadmin' || role === 'admin') return true;
  if (!patient || patient.is_historical !== false) return false;
  if (patient.cubicleNum) {
    const [links, doctors, station] = await Promise.all([
      db.from('user_cubicles').select('cubicle_id').eq('user_id', userId),
      db.from('doctors').select('id').eq('auth_id', authId),
      db.from('cubicle').select('id,doctorId').eq('cubicleNum', patient.cubicleNum).maybeSingle(),
    ]);
    if ([links, doctors, station].some(result => result.error)) return null;
    if (!historyRecord(station.data)) return false;
    const current = station.data;
    const ownsStation = rows(links.data).some(link => link.cubicle_id === current.id)
      || rows(doctors.data).some(doctor => doctor.id === current.doctorId);
    if (ownsStation) return true;
  }
  if (role === 'doctor' || role === 'nurse') return false;
  const [services, counters] = await Promise.all([
    db.from('user_services').select('service').eq('user_id', userId),
    db.from('user_counters').select('counter').eq('user_id', userId),
  ]);
  if (services.error || counters.error) return null;
  return rows(services.data).some(link => link.service === patient.service)
    || (patient.counter != null && rows(counters.data).some(link => link.counter === patient.counter));
}
