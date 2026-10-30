/** @fileoverview Authenticated physician management requests shared by staff pages. */
import { supabase } from '@/lib/supabase';
import { isDoctorRecord, parseDoctorDirectory } from './contracts';

/** @param body - Optional form action. @returns API response or an explicit sanitized error. */
async function requestDoctors(body?: Record<string, unknown>): Promise<unknown> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again to manage doctors.');
  const response = await fetch('/api/doctors', { method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  const result: unknown = await response.json();
  if (!response.ok) throw new Error(isDoctorRecord(result) && typeof result.error === 'string' ? result.error : 'Doctor management is unavailable.');
  return result;
}

/** @returns Shared validated physician names, station assignments and allowed controls. */
export async function fetchDoctorDirectory() { return parseDoctorDirectory(await requestDoctors()); }

/** @param body - Doctor or station changes. @returns Completion after explicit server acknowledgement. */
export async function saveDoctorAction(body: Record<string, unknown>): Promise<void> {
  const result = await requestDoctors(body);
  if (!isDoctorRecord(result) || result.success !== true) throw new Error('The doctor change was not acknowledged.');
}
