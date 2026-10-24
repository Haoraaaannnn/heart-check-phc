/**
 * @fileoverview Shared registration timer display and persisted pause/resume control.
 * @remarks Holds follow the patient and are respected by server rotation guards.
 */
'use client';

import { useState } from 'react';
import { Patient } from '@/types/Types';
import { ElapsedTimer } from './ElapsedTimer';
import { callRotateApi } from '../lib/rotateApi';

/**
 * Renders an accessible timer hold action for the current registration patient.
 * @param props - Current patient supplied by the workstation's realtime feed.
 * @returns Timer, pause/resume button, and actionable failure feedback.
 */
export function CounterTimerControl({ patient }: { patient: Patient }) {
  const [clock, setClock] = useState({ start: patient.counter_top_started_at, pause: patient.counter_paused_at });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** Persists a hold or shifts the start timestamp to exclude the held duration. */
  async function togglePause() {
    if (busy || !clock.start) return;
    setBusy(true);
    setError('');
    const now = Date.now();
    const next = clock.pause
      ? { start: new Date(new Date(clock.start).getTime() + Math.max(0, now - new Date(clock.pause).getTime())).toISOString(), pause: null }
      : { start: clock.start, pause: new Date(now).toISOString() };
    try {
      await callRotateApi([{
        id: patient.id,
        expected: { counter: patient.counter, counter_paused_at: clock.pause ?? null, counter_top_started_at: clock.start },
        counter_top_started_at: next.start,
        counter_paused_at: next.pause,
      }]);
      setClock(next);
    } catch {
      setError('Timer update failed. Refresh and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <ElapsedTimer startedAt={clock.start} endedAt={clock.pause} className="text-base" />
      <button type="button" aria-label={`${clock.pause ? 'Resume' : 'Pause'} counter ${patient.counter} timer`} aria-pressed={Boolean(clock.pause)} disabled={busy || !clock.start} onClick={() => void togglePause()} className="min-h-11 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-600">
        {busy ? 'Saving...' : clock.pause ? 'Resume' : 'Pause'}
      </button>
      {clock.pause && <span className="text-sm font-bold text-amber-700 dark:text-amber-300">Paused</span>}
      {error && <span role="alert" className="w-full text-sm text-red-700 dark:text-red-300">{error}</span>}
    </div>
  );
}
