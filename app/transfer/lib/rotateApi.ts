/** @fileoverview Authenticated patient rotation transport with mutation-result validation. */
import { supabase } from '@/lib/supabase';

/**
 * Submits patient changes and rejects failed optimistic concurrency checks.
 * @param updates - Patient changes with optional expected values.
 * @returns Resolves only when all requested mutations were applied.
 */
export async function callRotateApi(updates: any[]) {
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
    const text = await res.text().catch(() => '');
    let body: unknown = text;
    try { body = JSON.parse(text); } catch {}
    console.error('[rotate] API failed:', res.status, res.statusText, body);
    throw new Error(`Rotate API failed (${res.status})`);
  }
  const result = await res.json();
  if (!Array.isArray(result.results) || result.results.some((item: { applied: boolean }) => !item.applied)) {
    throw new Error('Patient changed or update was rejected. Refresh and try again.');
  }
}
