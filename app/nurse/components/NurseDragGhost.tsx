/**
 * @fileoverview Floating drag ghost preview component for the Nurse Dashboard.
 *
 * Renders an unclipped patient card preview via React Portal that follows
 * pointer coordinates during active drag-and-drop operations.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Patient } from '@/types/Types';
import { DragPoint } from '@/app/nurse/hooks/dragUtils';
import { ClinicalStage } from '@/app/nurse/types/nurse';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { staffPageScale } from '@/lib/displayPreferences';

/**
 * Props for the NurseDragGhost component.
 */
export interface NurseDragGhostProps {
  /** The patient currently being dragged, or null if idle. */
  patient: Patient | null;
  /** Current pointer coordinates `{ x, y }`. */
  point: DragPoint | null;
  /** Origin clinical stage descriptor. */
  sourceStage?: ClinicalStage | null;
  /** Whether the pointer is hovering over an eligible target stage. */
  isValidDropTarget?: boolean;
}

/**
 * Portal-based floating drag preview card rendered during pointer drag operations.
 *
 * @param props - Patient and coordinate properties for rendering the ghost.
 * @returns The portaled drag preview, or null when inactive.
 */
export function NurseDragGhost({
  patient,
  point,
  sourceStage,
  isValidDropTarget,
}: NurseDragGhostProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !patient || !point) {
    return null;
  }

  let originLabel = '';
  if (sourceStage === 'assigned') originLabel = nurseTexts.stageAssignedHeading;
  else if (sourceStage === 'with_doctor') originLabel = nurseTexts.stageWithDoctorHeading;
  else if (sourceStage === 'carryout') originLabel = nurseTexts.stageCarryoutHeading;

  const ghostContent = (
    <div
      className="phc-ghost pointer-events-none fixed z-99999 select-none"
      style={{
        left: `${point.x / staffPageScale()}px`,
        top: `${point.y / staffPageScale()}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`w-64 p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
          isValidDropTarget
            ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/95 dark:bg-emerald-950/90'
            : 'border-[#cc3535] ring-2 ring-red-400/30'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#cc3535] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            {patient.patientNum}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 dark:text-[#f5f5f5] whitespace-normal break-words">
              {patient.service}
              {patient.subcategory ? ` · ${patient.subcategory}` : ''}
            </p>
            {originLabel && (
              <p className="text-[10px] text-gray-500 dark:text-[#a3a3a3] font-medium whitespace-normal break-words">
                {originLabel}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isValidDropTarget
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80'
                : 'bg-red-100 text-[#cc3535] border border-red-200 dark:bg-red-950/80 dark:text-[#f87171] dark:border-red-900/80'
            }`}
          >
            {isValidDropTarget ? 'Ready to drop' : 'Moving'}
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(ghostContent, document.body);
}

export default NurseDragGhost;
