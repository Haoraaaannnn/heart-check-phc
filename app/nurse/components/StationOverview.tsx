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
  return (
    <section aria-label={nurseTexts.overviewTitle} className="shrink-0 px-2 py-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="break-words whitespace-normal text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-[#f5f5f5]">{scopeLabel}</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-[#a3a3a3]">{nurseTexts.overviewTitle}</p>
        </div>
        <dl className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-2xs">
            <dt className="order-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-[#a3a3a3]">{nurseTexts.activePatients}</dt>
            <dd className="order-1 text-xl font-black tabular-nums text-slate-900 dark:text-[#f5f5f5]">{activeCount}</dd>
          </div>
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-2xs">
            <dt className="order-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">{nurseTexts.completedToday}</dt>
            <dd className="order-1 text-xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">{finishedCount}</dd>
          </div>
        </dl>
      </div>
      {selectedTicket && (
        <p role="status" className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-red-800 dark:text-red-200">
          <span className="font-bold">{selectedTicket}</span><span>{nurseTexts.selectedTicketHint}</span>
        </p>
      )}
    </section>
  );
}
