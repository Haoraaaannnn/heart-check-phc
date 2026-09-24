'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '../constants/transferTexts';
import { ScrollArea } from '@/components/reusables/ScrollArea';

/**
 * Props for `IdleNumbersPanel`.
 */
export interface IdleNumbersPanelProps {
  /** Array of idle patients. */
  patients: Patient[];
  /** Callback to restore an idle patient back to active queue. */
  onActivate: (patient: Patient) => void;
  /** Callback to permanently dismiss an idle patient. */
  onRemove: (patient: Patient) => void;
  /** Optional compact styling flag. */
  compact?: boolean;
}

/**
 * Panel presenting patients in idle status (timed out 5+ times).
 *
 * @remarks
 * Preserves the rotation timeout counter badge (`×N`) and provides instant reactivation
 * or removal actions.
 *
 * @param props - Patient data and state transition callbacks.
 * @returns The rendered IdleNumbersPanel component.
 */
export function IdleNumbersPanel({
  patients,
  onActivate,
  onRemove,
  compact = false,
}: IdleNumbersPanelProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-xs transition-all ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
          <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
            {transferTexts.idleNumbersHeading}
          </h2>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {patients.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-normal">
          {transferTexts.idleSubtitle}
        </span>
      </div>

      {/* Patients List */}
      {patients.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          {transferTexts.noIdleNumbers}
        </div>
      ) : (
        <ScrollArea className="max-h-[360px] pr-1 space-y-2">
          {patients.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-slate-800 font-black text-sm">
                  {p.patientNum}
                </span>
                <span className="text-slate-500 text-xs truncate">
                  {p.service}
                  {p.subcategory && ` · ${p.subcategory}`}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                  {transferTexts.rotationCountPrefix}
                  {p.rotation_count ?? 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => onActivate(p)}
                  title={transferTexts.activateIdleTooltip}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <i className="bx bx-play-circle text-base" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(p)}
                  title={transferTexts.removeIdleTooltip}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <i className="bx bx-trash text-base" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}

export default IdleNumbersPanel;
