/**
 * @fileoverview Open stage list with patient rows and the existing clinical drop-target behavior.
 *
 * Houses patient cards for a specific clinical stage with internal vertical scrolling
 * (`flex-1 overflow-y-auto min-h-0`), dropzone hit-testing via `data-stage-id`,
 * and visual target illumination during drag-and-drop or tablet selection modes.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import { ClinicalStage } from '@/app/nurse/types/nurse';
import { NurseStyle } from '@/app/nurse/constants/nurse';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { cubicleStyles } from '@/constants/designs/transferStyles';

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
      id={`care-list-${stage}`}
      data-stage-id={stage}
      style={columnStyle}
      aria-label={title}
      className={`min-w-0 flex-1 border-b border-slate-200 transition-colors duration-150 bg-white dark:border-[#2e2e2e] dark:bg-[#1a1a1a] lg:border-b-0 lg:border-r lg:last:border-r-0 ${
        isTargetActive
          ? 'ring-2 ring-inset ring-emerald-600/20'
          : ''
      }`}
    >
      {/* Column Header */}
      <div style={NurseStyle.stageColumnHeader} className="flex flex-wrap items-center justify-between gap-2 min-w-0 border-b border-slate-100 dark:border-[#2e2e2e]">
        <div className="flex items-baseline gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h2 className={cubicleStyles.headerTitle}>{title}</h2>
          </div>
          <span className={`${cubicleStyles.headerCountBadge} ${badgeColorClass} text-lg`}>{count}</span>
        </div>

        {/* Quick 'Move Here' button during Click-to-Select tablet mode */}
        {isValidSelectionTarget && onMoveHere && (
          <button
            type="button"
            onClick={onMoveHere}
            className="inline-flex min-h-[38px] items-center px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 transition-colors cursor-pointer shrink-0 whitespace-normal"
          >
            <span>{nurseTexts.btnMoveHere}</span>
          </button>
        )}
      </div>

      {/* Internal Scrollable Content (Page does NOT scroll) */}
      <div style={NurseStyle.stageColumnContent} className="phc-scroll">
        {count === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center min-h-[160px]">
            <p className="text-sm text-slate-400 dark:text-[#737373] font-medium max-w-[260px] leading-relaxed">
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
