import { supabase } from '@/lib/supabase';

export async function adminApi(path: string, method: string = 'GET', body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}