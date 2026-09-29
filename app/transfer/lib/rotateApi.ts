// app/transfer/lib/rotateApi.ts
import { supabase } from '@/lib/supabase';

/** Sends rotation updates; each row only applies if its `expected` columns still match. */
export async function callRotateApi(updates: any[]) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[rotate] API update failed:', body);
  }
}