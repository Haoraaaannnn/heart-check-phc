/**
 * @fileoverview Panel presenting patients in idle status (timed out 5+ times).
 *
 * Implements smooth internal scrolling for the idle list while preserving
 * rotation timeout counter badge (`×N`) and one-click reactivation or removal actions.
 *
 * @module app/transfer/components/IdleNumbersPanel
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '../constants/transferTexts';

/**
 * Props for {@link IdleNumbersPanel}.
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
 * Idle Numbers panel fitting inside the QueuePanel with smooth internal scrolling.
 *
 * @param props - Patient data and state transition callbacks.
 * @returns The rendered IdleNumbersPanel component.
 */
export function IdleNumbersPanel({
  patients,
  onActivate,
  onRemove,
}: IdleNumbersPanelProps) {
  const safePatients = Array.isArray(patients) ? patients : [];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
          <h2 className="text-slate-700 font-bold text-xs tracking-wider uppercase">
            {transferTexts.idleNumbersHeading}
          </h2>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {safePatients.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-normal">
          {transferTexts.idleSubtitle}
        </span>
      </div>

      {/* Patients List (Scrollable when exceeding height) */}
      {safePatients.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          {transferTexts.noIdleNumbers}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto phc-scroll pr-1 space-y-1.5">
          {safePatients.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between border border-slate-100 rounded-xl px-2.5 py-1.5 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-800 font-black text-xs">
                  {p.patientNum}
                </span>
                <span className="text-slate-500 text-xs truncate">
                  {p.service}
                  {p.subcategory && ` · ${p.subcategory}`}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 shrink-0">
                  {transferTexts.rotationCountPrefix}
                  {p.rotation_count ?? 0}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => onActivate(p)}
                  title={transferTexts.activateIdleTooltip}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <i className="bx bx-play-circle text-sm" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(p)}
                  title={transferTexts.removeIdleTooltip}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <i className="bx bx-trash text-sm" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IdleNumbersPanel;
