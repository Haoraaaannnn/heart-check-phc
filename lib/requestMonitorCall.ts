/** @fileoverview Authenticated staff-to-monitor call transport with no local audio playback. */
import { supabase } from '@/lib/supabase';

/**
 * Requests a call on the monitor selected by the server from current patient data.
 * @param patientId - The active patient being called.
 * @returns Resolves after durable delivery is accepted; rejects actionable failures.
 */
export async function requestMonitorCall(patientId: number): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const response = await fetch('/api/monitor-calls', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ patientId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to send the call to the monitor.');
}
