/** @fileoverview Explicit queue-view scope with attending physicians and station locations. */
'use client';
import type { AssignedNurseCubicle } from '@/app/nurse/types/nurse';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';

/**
 * Names displayed stations and offers a same-service shared view only for OPD Screening.
 * @param props - Visible station metadata, current scope and explicit view toggle.
 * @returns A compact workstation context bar with naturally wrapping clinical labels.
 */
export function StationScopeBar({ stations, showAllScreening, canViewAllScreening = false, onToggle }: {
  stations: AssignedNurseCubicle[]; showAllScreening: boolean; canViewAllScreening?: boolean; onToggle: () => void;
}) {
  return <section aria-label={nurseTexts.stationScope} className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-6 py-2.5 dark:border-[#2e2e2e] dark:bg-[#141414]">
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-slate-700 dark:text-[#d4d4d4]">{showAllScreening ? nurseTexts.viewingAllScreening : nurseTexts.viewingMyNumbers}</p>
      <ul className="mt-1 max-h-24 space-y-1 overflow-y-auto text-xs text-slate-500 dark:text-[#a3a3a3]">
        {stations.map(station => <li key={station.id} className="break-words whitespace-normal">
          <span className="font-semibold text-slate-700 dark:text-[#f5f5f5]">{station.cubicleNum}</span>
          {' · '}{nurseTexts.roomPrefix} {station.room}{' · '}{nurseTexts.doctorOnDuty} {station.doctorName || nurseTexts.noDoctorAssigned}
        </li>)}
        {stations.length === 0 && <li>{nurseTexts.noStationsInView}</li>}
      </ul>
    </div>
    {(canViewAllScreening || showAllScreening) && <button type="button" aria-pressed={showAllScreening} onClick={onToggle}
      className="min-h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:text-[#f5f5f5] dark:hover:bg-[#242424]">
      {showAllScreening ? nurseTexts.showMyNumbers : nurseTexts.showAllScreening}
    </button>}
  </section>;
}
