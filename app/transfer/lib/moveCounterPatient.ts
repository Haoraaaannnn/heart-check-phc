/** @fileoverview Acknowledged counter transfer transport; failures never appear as successful moves. */
import { supabase } from '@/lib/supabase';

/**
 * Requests an authorized, guarded counter handoff.
 * @param options - Ticket identifier and expected source/destination.
 * @returns Completion only when persistence is acknowledged.
 */
export async function moveCounterPatient(options: { patientId: number; sourceCounter: number; targetCounter: number }): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const response = await fetch('/api/counter-transfer', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(options),
  });
  const body: unknown = await response.json();
  if (!response.ok || typeof body !== 'object' || body === null || !('success' in body) || body.success !== true) {
    throw new Error('The ticket was not moved. Refresh and choose an open, staffed counter serving this service.');
  }
}
