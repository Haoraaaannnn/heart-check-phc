/** @fileoverview Nurse saves use the authorized API; only durable offline writes report deferred success. */
import { supabase } from '@/lib/supabase';
import { enqueueMutation, removeMutation } from '@/lib/offlineQueue';
import { fetchWithDeadline, withRequestDeadline } from '@/lib/requestFetch';

/**
 * Persists a nurse action without bypassing server rejection through a direct database fallback.
 * @param options - Existing patient identity, clinical fields and original stage.
 * @returns Confirmed/deferred success, or a visible error requiring rollback.
 */
export async function persistNurseTransition(options: {
  patientId: number; updates: Record<string, string | null>; expectedStatus: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let queuedId: string | null = null;
  try {
    const { data: { session } } = await withRequestDeadline(supabase.auth.getSession());
    if (!session) return { ok: false, error: 'Your session has expired. Please sign in again.' };
    try {
      const queued = await enqueueMutation({ table: 'patients', type: 'update', payload: options.updates,
        matchKey: 'id', matchValue: options.patientId, clientTimestamp: new Date().toISOString(),
        endpoint: '/api/nurse/patients', ownerAuthId: session.user.id, expectedStatus: options.expectedStatus,
        description: 'Nurse clinical stage update' });
      queuedId = queued.id;
    } catch { /* A direct acknowledged save is still safe when local storage is unavailable. */ }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return queuedId ? { ok: true } : { ok: false, error: 'Offline storage is unavailable. The patient was kept at the previous stage.' };
    }
    const response = await fetchWithDeadline('/api/nurse/patients', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(options),
    });
    if (response.ok) {
      if (queuedId) await removeMutation(queuedId);
      return { ok: true };
    }
    if (queuedId && (response.status >= 500 || response.status === 429)) return { ok: true };
    if (queuedId) await removeMutation(queuedId);
    const body: unknown = await response.json().catch(() => null);
    const error = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error : 'The patient could not be updated. Refresh and try again.';
    return { ok: false, error };
  } catch {
    return queuedId ? { ok: true } : { ok: false, error: 'The update could not be saved. The patient was kept at the previous stage.' };
  }
}
