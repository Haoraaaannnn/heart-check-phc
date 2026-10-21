/**
 * @fileoverview Portal-based floating drag preview card that follows pointer position across the viewport.
 *
 * Implements smooth pointer tracking and visual indication of valid vs invalid drop zones.
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from dragGhostStyles.
 *
 * @module app/transfer/components/DragGhost
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Patient } from '@/types/Types';
import { DragPoint } from '@/app/transfer/hooks/dragUtils';
import { dragGhostStyles } from '@/constants/designs/transferStyles';

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
      className={dragGhostStyles.container}
      style={{
        left: `${point.x}px`,
        top: `${point.y}px`,
      }}
    >
      <div
        className={
          isValidDropTarget
            ? dragGhostStyles.cardValid
            : dragGhostStyles.cardInvalid
        }
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={dragGhostStyles.patientBadge}>
            {patient.patientNum}
          </div>
          <div className="min-w-0">
            <p className={dragGhostStyles.serviceText}>
              {patient.service}
              {patient.subcategory ? ` · ${patient.subcategory}` : ''}
            </p>
            {originDescription && (
              <p className={dragGhostStyles.originText}>
                {originDescription}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={
              isValidDropTarget
                ? dragGhostStyles.statusBadgeValid
                : dragGhostStyles.statusBadgeMoving
            }
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
