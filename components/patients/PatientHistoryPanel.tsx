/** @fileoverview Accessible ticket timeline with explicit failures and older-event pagination. */
'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { historyAction, historyActor, historyLocation, historyTimingChanges, type HistoryState, type PatientHistoryEvent } from '@/lib/patientHistory';
import { usePatientHistory } from './usePatientHistory';

const TIME = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'medium' });
const BUTTON = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-[#414141] dark:hover:bg-[#292929]';

/** @returns The location and clinical context for one side of a handoff. */
function StepState({ label, state }: { label: string; state: HistoryState | null }) {
  return <div className="min-w-0 flex-1 rounded-lg border border-slate-200 p-3 dark:border-[#363636]">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#a3a3a3]">{label}</p>
    <p className="mt-1 break-words font-semibold">{historyLocation(state)}</p>
    {state && <p className="mt-1 break-words text-sm text-slate-600 dark:text-[#b8b8b8]">
      {[state.status, state.service, state.subcategory].filter(Boolean).join(' · ')}
    </p>}
  </div>;
}

/** @returns One immutable step, including who performed it and its server timestamp. */
function HistoryStep({ event }: { event: PatientHistoryEvent }) {
  const before = event.from_state;
  const after = event.to_state;
  return <li className="relative border-l-2 border-slate-200 pb-6 pl-5 last:pb-0 dark:border-[#414141]">
    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-[#cc3535]" />
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="font-bold">{historyAction(event)}</h3>
        <p className="break-words text-sm">{historyActor(event)}{event.actor_role && ` · ${event.actor_role}`}</p></div>
      <time dateTime={event.occurred_at} className="text-xs text-slate-500 dark:text-[#a3a3a3]">{TIME.format(new Date(event.occurred_at))}</time>
    </div>
    {event.event_type === 'baseline' ? <p className="mt-3 text-sm text-slate-600 dark:text-[#b8b8b8]">
      Detailed recording began here. Earlier movements and their operators were not recorded.
    </p> : null}
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      {event.event_type !== 'baseline' && <StepState label="From" state={before} />}
      <StepState label={event.event_type === 'baseline' ? 'Observed starting point' : event.event_type === 'call' ? 'Called at' : 'To'} state={after} />
    </div>
    {historyTimingChanges(event).map(change => <p key={change.label} className="mt-2 break-words text-xs text-slate-500 dark:text-[#a3a3a3]">
      {change.label}: {change.from ? TIME.format(new Date(change.from)) : 'Not set'} → {change.to ? TIME.format(new Date(change.to)) : 'Cleared'}
    </p>)}
    {(before?.rotation_count !== after?.rotation_count || before?.queue_position !== after?.queue_position) && <p className="mt-2 text-xs text-slate-500 dark:text-[#a3a3a3]">
      {before?.rotation_count !== after?.rotation_count && `Rotation: ${before?.rotation_count ?? 0} → ${after?.rotation_count ?? 0}. `}
      {before?.queue_position !== after?.queue_position && `Queue position: ${before?.queue_position ?? 'Unassigned'} → ${after?.queue_position ?? 'Unassigned'}.`}
    </p>}
  </li>;
}

/**
 * Shows a modal timeline without moving the workstation layout or exposing patient contact data.
 * @param props - Database ticket identity, display number, and close callback.
 * @returns A native modal dialog with focus containment and Escape dismissal.
 */
export function PatientHistoryPanel({ patientId, ticket, onClose }: { patientId: string; ticket: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { events, cursor, error, loading, loadPage } = usePatientHistory(patientId);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return createPortal(<dialog ref={dialog} aria-labelledby="patient-history-title" onCancel={onClose}
    onMouseDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}
    onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[min(94vw,760px)] overflow-hidden rounded-2xl border border-slate-300 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50 dark:border-[#414141] dark:bg-[#1a1a1a] dark:text-white">
    <div className="flex max-h-[90dvh] flex-col" onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-[#363636]">
        <div><h2 id="patient-history-title" className="break-words text-xl font-bold">History · {ticket}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#a3a3a3]">Latest step first · Manila time · Staff shown by username</p></div>
        <button type="button" className={BUTTON} onClick={onClose} autoFocus>Close</button>
      </header>
      <div className="min-h-0 overflow-y-auto p-5" aria-busy={loading}>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-[#302020] dark:text-red-200">{error}</p>}
        {loading && <p role="status" className="mb-4 text-sm">Loading history…</p>}
        {!loading && !error && !events.length && <p className="text-sm">No detailed steps were recorded for this ticket. Earlier handoffs cannot be reconstructed.</p>}
        <ol className="ml-1">{events.map(event => <HistoryStep key={event.id} event={event} />)}</ol>
        {cursor && <button type="button" className={`${BUTTON} mt-5`} disabled={loading}
          onClick={() => loadPage(cursor)}>Load older steps</button>}
      </div>
      <footer className="shrink-0 border-t border-slate-200 p-4 dark:border-[#363636]">
        <button type="button" className={BUTTON} disabled={loading}
          onClick={() => loadPage(null)}>Refresh history</button>
      </footer>
    </div>
  </dialog>, document.body);
}
