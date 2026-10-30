/** @fileoverview Authenticated patient rotation transport with mutation-result validation. */
import { supabase } from '@/lib/supabase';

/** A concurrent patient change requires a fresh snapshot rather than retrying the stale rotation. */
export class RotationConflictError extends Error { readonly name = 'RotationConflictError'; }

/**
 * Submits patient changes and rejects failed optimistic concurrency checks.
 * @param updates - Patient changes with optional expected values.
 * @returns Resolves only when all requested mutations were applied.
 */
export async function callRotateApi(updates: Array<{ id: number } & Record<string, unknown>>) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch('/api/rotate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    throw new Error(`Rotate API failed (${res.status})`);
  }
  const result: unknown = await res.json();
  if (typeof result !== 'object' || result === null || !('results' in result) ||
      !Array.isArray(result.results) || result.results.length !== updates.length) {
    throw new Error('The queue service returned an invalid update response.');
  }
  const failed: Record<string, unknown>[] = [];
  const returnedIds = new Set<number>();
  for (const item of result.results) {
    if (typeof item !== 'object' || item === null || !('id' in item) || typeof item.id !== 'number' ||
        !updates.some(update => update.id === item.id) || returnedIds.has(item.id) ||
        !('applied' in item) || typeof item.applied !== 'boolean') throw new Error('The queue update acknowledgement was invalid.');
    returnedIds.add(item.id);
    if (!item.applied) failed.push(item);
  }
  if (failed.some(item => item.code !== 'stale' && !(item.code == null && item.error == null))) {
    throw new Error('The queue service could not save this update. Please retry or contact the superadmin.');
  }
  if (failed.length > 0) throw new RotationConflictError('This ticket changed on another workstation. The queue needs to refresh.');
}
