/**
 * @fileoverview Pipeline stage column component for the Nurse Dashboard Kanban board.
 *
 * Houses patient cards for a specific clinical stage with internal vertical scrolling
 * (`flex-1 overflow-y-auto min-h-0`), dropzone hit-testing via `data-stage-id`,
 * and visual target illumination during drag-and-drop or tablet selection modes.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import { ClinicalStage } from '../types/nurse';
import { NurseStyle } from '../constants/nurse';
import { nurseTexts } from '../constants/nurseTexts';

/**
 * Props for the StageColumn component.
 */
export interface StageColumnProps {
  /** The clinical stage represented by this column. */
  stage: ClinicalStage;
  /** Section heading label. */
  title: string;
  /** Boxicon class name for stage indicator icon. */
  icon: string;
  /** Badge color class string for patient count. */
  badgeColorClass: string;
  /** Current count of patients in this stage. */
  count: number;
  /** Empty state text displayed when patient roster is zero. */
  emptyText: string;
  /** Whether pointer is currently hovering over this stage during active drag. */
  isDragOver?: boolean;
  /** Whether this stage is an eligible target during Click-to-Select tablet mode. */
  isValidSelectionTarget?: boolean;
  /** Callback triggered when user clicks '+ Move Here' button in selection mode. */
  onMoveHere?: () => void;
  /** Rendered patient cards to display within the scroll container. */
  children: React.ReactNode;
}

/**
 * Pipeline column container with dropzone attributes and internal scrolling.
 *
 * @param props - Column configuration and children.
 * @returns The rendered stage column element.
 */
export function StageColumn({
  stage,
  title,
  icon,
  badgeColorClass,
  count,
  emptyText,
  isDragOver,
  isValidSelectionTarget,
  onMoveHere,
  children,
}: StageColumnProps) {
  const isTargetActive = isDragOver || isValidSelectionTarget;

  return (
    <section
      data-stage-id={stage}
      style={{
        ...NurseStyle.stageColumn,
        ...(isTargetActive ? NurseStyle.activeDropzone : {}),
      }}
      className={`transition-all duration-150 ${
        isTargetActive
          ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20'
          : ''
      }`}
    >
      {/* Column Header */}
      <div style={NurseStyle.stageColumnHeader}>
        <div className="flex items-center gap-2 min-w-0">
          <i className={`bx ${icon} text-lg text-slate-500`} aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
            {title}
          </h2>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${badgeColorClass}`}
          >
            {count}
          </span>
        </div>

        {/* Quick 'Move Here' button during Click-to-Select tablet mode */}
        {isValidSelectionTarget && onMoveHere && (
          <button
            type="button"
            onClick={onMoveHere}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer animate-pulse"
          >
            <i className="bx bx-plus text-sm" aria-hidden="true" />
            <span>{nurseTexts.btnMoveHere}</span>
          </button>
        )}
      </div>

      {/* Internal Scrollable Content (Page does NOT scroll) */}
      <div style={NurseStyle.stageColumnContent} className="phc-scroll">
        {count === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[160px]">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <i className={`bx ${icon} text-xl`} aria-hidden="true" />
            </div>
            <p className="text-xs text-slate-400 font-medium max-w-[200px]">
              {emptyText}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default StageColumn;
