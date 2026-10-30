/** @fileoverview Compact clinical workload overview using the board's current filtered patient counts. */
'use client';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';

/**
 * Summarizes the visible clinical workload without fetching or changing patient records.
 * @param props - Visible patient totals, scope label and optional selected ticket.
 * @returns A responsive station overview with an accessible selection hint.
 */
export function StationOverview({ activeCount, finishedCount, scopeLabel, selectedTicket }: {
  activeCount: number; finishedCount: number; scopeLabel: string; selectedTicket?: string;
}) {
  return <section aria-label={nurseTexts.overviewTitle} className="shrink-0 px-1 py-1">
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h1 className="break-words whitespace-normal text-lg font-semibold tracking-tight text-slate-900 dark:text-[#f5f5f5]">{scopeLabel}</h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-[#a3a3a3]">{nurseTexts.overviewTitle}</p>
      </div>
      <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-[#a3a3a3]">
        <div className="flex items-baseline gap-1.5">
          <dt className="order-2">{nurseTexts.activePatients}</dt>
          <dd className="order-1 text-base font-semibold tabular-nums text-slate-900 dark:text-[#f5f5f5]">{activeCount}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="order-2">{nurseTexts.completedToday}</dt>
          <dd className="order-1 text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{finishedCount}</dd>
        </div>
      </dl>
    </div>
    {selectedTicket && <p role="status" className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-red-800 dark:text-red-200">
      <span className="font-bold">{selectedTicket}</span><span>{nurseTexts.selectedTicketHint}</span>
    </p>}
  </section>;
}
