/** @fileoverview Reusable ticket history entry point that does not trigger queue selection or dragging. */
'use client';
import { useState } from 'react';
import { historyId } from '@/lib/patientHistory';
import { PatientHistoryPanel } from './PatientHistoryPanel';
import { PatientTicketMenu } from './PatientTicketMenu';

/** @returns A scoped history action and its independently mounted modal timeline. */
export function PatientHistoryButton({ patientId, ticket, compact = false }: { patientId: string | number; ticket?: string | null; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = historyId(patientId);
  if (!id) return null;
  return <>
    {compact ? <PatientTicketMenu ticket={ticket || id} onHistory={() => setOpen(true)} /> : <button type="button" onPointerDown={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setOpen(true); }}
      aria-label={`View history for ${ticket || id}`}
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-[#414141] dark:text-[#c5c5c5] dark:hover:bg-[#292929]">History</button>}
    {open && <PatientHistoryPanel patientId={id} ticket={ticket || `Ticket ${id}`} onClose={() => setOpen(false)} />}
  </>;
}
