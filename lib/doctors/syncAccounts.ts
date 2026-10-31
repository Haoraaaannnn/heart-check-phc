/** @fileoverview Links doctor accounts to the physician directory without overwriting edited names. */
import type { SupabaseClient } from '@supabase/supabase-js';

/** @param value - External row. @returns Whether fields can be inspected safely. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Adds missing account-linked physicians using their staff username as the initial display name.
 * @param options - Server database client and optional authenticated account filter.
 * @returns Completion only after missing physicians are persisted or concurrent inserts verified.
 * @remarks Existing names, specialties, availability and station assignments are preserved.
 */
export async function syncDoctorAccounts(options: { db: SupabaseClient; authId?: string }): Promise<void> {
  const { db } = options;
  let query = db.from('users').select('auth_id,username').eq('role', 'doctor');
  let doctorQuery = db.from('doctors').select('auth_id');
  if (options.authId) {
    query = query.eq('auth_id', options.authId);
    doctorQuery = doctorQuery.eq('auth_id', options.authId);
  }
  const [{ data: accounts, error: accountError }, { data: doctors, error: doctorError }] = await Promise.all([
    query,
    doctorQuery,
  ]);
  const accountRows: unknown = accounts; const doctorRows: unknown = doctors;
  if (accountError || doctorError || !Array.isArray(accountRows) || !Array.isArray(doctorRows) ||
      !accountRows.every(isRecord) || !doctorRows.every(isRecord)) throw new Error('Doctor accounts could not be loaded.');
  const linked = new Set(doctorRows.map(row => row.auth_id));
  const missing: { auth_id: string; full_name: string; active: boolean }[] = [];
  for (const account of accountRows) {
    if (typeof account.auth_id !== 'string' || !account.auth_id || linked.has(account.auth_id)) continue;
    const name = typeof account.username === 'string' ? account.username.trim() : '';
    if (!name) throw new Error('A doctor account needs a username before it can be listed.');
    missing.push({ auth_id: account.auth_id, full_name: name, active: true }); linked.add(account.auth_id);
  }
  if (missing.length === 0) return;
  const { error } = await db.from('doctors').insert(missing);
  if (!error) return;
  if (error.code !== '23505') throw new Error('Doctor accounts could not be added to the directory.');
  const { data: concurrent, error: concurrentError } = await db.from('doctors').select('auth_id').in('auth_id', missing.map(row => row.auth_id));
  const rows: unknown = concurrent;
  if (!concurrentError && Array.isArray(rows) && rows.every(isRecord) &&
      missing.every(row => rows.some(candidate => candidate.auth_id === row.auth_id))) return;
  throw new Error('Doctor accounts changed while loading. Please retry.');
}
