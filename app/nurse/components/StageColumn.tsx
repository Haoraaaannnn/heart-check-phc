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
  /** Optional legacy icon class name. */
  icon?: string;
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
  onMoveHere?: () => void | Promise<boolean | void>;
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
  badgeColorClass,
  count,
  emptyText,
  isDragOver,
  isValidSelectionTarget,
  onMoveHere,
  children,
}: StageColumnProps) {
  const isTargetActive = isDragOver || isValidSelectionTarget;
  const columnStyle = isTargetActive
    ? { ...NurseStyle.stageColumn, ...NurseStyle.activeDropzone }
    : NurseStyle.stageColumn;

  return (
    <section
      data-stage-id={stage}
      style={columnStyle}
      className={`transition-all duration-150 ${
        isTargetActive
          ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20'
          : ''
      }`}
    >
      {/* Column Header */}
      <div style={NurseStyle.stageColumnHeader} className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
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
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer animate-pulse shrink-0 whitespace-nowrap ml-1.5"
          >
            <span>{nurseTexts.btnMoveHere}</span>
          </button>
        )}
      </div>

      {/* Internal Scrollable Content (Page does NOT scroll) */}
      <div style={NurseStyle.stageColumnContent} className="phc-scroll">
        {count === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[160px]">
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
