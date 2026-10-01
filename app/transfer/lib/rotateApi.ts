import { supabase } from '@/lib/supabase';

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
}