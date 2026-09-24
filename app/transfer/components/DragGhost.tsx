'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Patient } from '@/types/Types';
import { DragPoint } from '../hooks/dragUtils';

/**
 * Props for `DragGhost`.
 */
export interface DragGhostProps {
  /** The patient currently being dragged, or null if no drag is active. */
  patient: Patient | null;
  /** Current pointer coordinates. */
  point: DragPoint | null;
  /** Optional descriptive origin text (e.g., "From Queue" or "From Cubicle A-1"). */
  originDescription?: string | null;
  /** Whether the pointer is currently hovering over a valid drop target. */
  isValidDropTarget?: boolean;
}

/**
 * Portal-based floating drag preview card that follows pointer position across the viewport.
 *
 * @param props - Patient and coordinate properties for rendering the ghost.
 * @returns The portaled drag ghost preview, or null when inactive.
 */
export function DragGhost({
  patient,
  point,
  originDescription,
  isValidDropTarget,
}: DragGhostProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !patient || !point) {
    return null;
  }

  const ghostContent = (
    <div
      className="phc-ghost pointer-events-none fixed z-99999 select-none"
      style={{
        left: `${point.x}px`,
        top: `${point.y}px`,
      }}
    >
      <div
        className={`w-64 p-3 rounded-2xl bg-white border-2 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
          isValidDropTarget
            ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/90'
            : 'border-[#cc3535] ring-2 ring-red-400/30'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#cc3535] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            {patient.patientNum}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">
              {patient.service}
              {patient.subcategory ? ` · ${patient.subcategory}` : ''}
            </p>
            {originDescription && (
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {originDescription}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isValidDropTarget
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-[#cc3535]'
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

export default DragGhost;
