/** @fileoverview Authenticated history loading with cancellation and explicit pagination failures. */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWithDeadline, withRequestDeadline } from '@/lib/requestFetch';
import { historyId, historyRecord, parseHistoryEvents, type PatientHistoryEvent } from '@/lib/patientHistory';

/** @returns A validated page or a user-readable failure, without logging private database errors. */
async function readPage(options: { patientId: string; before: string | null; signal: AbortSignal }) {
  const { data: { session }, error } = await withRequestDeadline(supabase.auth.getSession());
  if (error || !session) throw new Error('Please sign in again to view ticket history.');
  const params = new URLSearchParams({ patientId: options.patientId });
  if (options.before) params.set('before', options.before);
  const response = await fetchWithDeadline(`/api/patient-history?${params}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store', signal: options.signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(historyRecord(body) && typeof body.error === 'string' ? body.error : 'Unable to load ticket history.');
  const events = historyRecord(body) ? parseHistoryEvents(body.events) : null;
  if (!events || !historyRecord(body) || (body.nextCursor !== null && !historyId(body.nextCursor))) throw new Error('The history response could not be verified.');
  return { events, cursor: historyId(body.nextCursor) };
}

/**
 * Loads only the selected ticket, cancelling stale requests when the dialog closes.
 * @param patientId - Validated immutable ticket identity; the parent remounts for a new ticket.
 * @returns Timeline state and a retryable older-page/refresh action.
 */
export function usePatientHistory(patientId: string) {
  const [events, setEvents] = useState<PatientHistoryEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<{ before: string | null; revision: number }>({ before: null, revision: 0 });
  useEffect(() => {
    const controller = new AbortController();
    void readPage({ patientId, before: request.before, signal: controller.signal }).then(page => {
      if (controller.signal.aborted) return;
      setEvents(current => request.before ? [...current, ...page.events] : page.events);
      setCursor(page.cursor);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load ticket history.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [patientId, request]);
  /** @param before - Null refreshes the latest steps; a cursor appends earlier ones. */
  function loadPage(before: string | null) {
    setLoading(true);
    setError(null);
    setRequest(current => ({ before, revision: current.revision + 1 }));
  }
  return { events, cursor, error, loading, loadPage };
}
