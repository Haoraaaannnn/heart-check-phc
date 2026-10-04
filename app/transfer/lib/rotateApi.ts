export async function callRotateApi(updates: any[]) {
  const res = await fetch('/api/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[rotate] API upsert failed:', body);
  }
}