/**
 * @fileoverview Active rotating queue panel with the current shift policy.
 *
 * Sized to fill the left dashboard column, providing a space-efficient tabbed interface
 * whose patient lists scroll internally while the outer container remains non-scrollable.
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/QueuePanel
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { OnProgressSection } from '@/app/transfer/components/OnProgressSection';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { transferTexts } from '@/constants/texts/transferTexts';
import { queuePanelStyles } from '@/constants/designs/transferStyles';
import { SelectedTransferPatient } from '@/app/transfer/types/transfer';

/**
 * Props for {@link QueuePanel}.
 */
export interface QueuePanelProps {
  /** Active queue patients. */
  onProgressPatients: Patient[];
  /** Whether drag-and-drop or tap assignment is enabled. */
  isDraggable: boolean;
  /** Active service category name. */
  selectedCategory: string | null;
  /** ID of patient currently being dragged. */
  draggedPatientId?: number;
  /** Currently selected patient in Click-to-Select mode. */
  selectedPatient?: SelectedTransferPatient | null;
  /** Callback triggered when user taps an unlocked queue patient. */
  onSelectQueuePatient?: (patient: Patient) => void;
  /** Pointer down drag initiation handler. */
  onPointerDown?: (e: React.PointerEvent, patient: Patient) => void;
  /** Mouse drag initiation handler (backward compatibility). */
  onDragStart?: (e: React.MouseEvent, patient: Patient) => void;
  /** Audio announcement callback. */
  onSpeak: (text: string, patientId: number) => void;
  /** Instant assignment callback. */
  onAssignNow?: (patient: Patient) => void;
  /** ID of patient currently being spoken. */
  speakingId?: number | null;
  /** Seconds before elapsed timer triggers a warning state. */
  warnAfterSeconds?: number;
}

/**
 * Active queue panel; cancelled tickets remain in reports rather than an idle list.
 *
 * @param props - Active queue data with user action handlers.
 * @returns The rendered tabbed panel component.
 */
export function QueuePanel({
  onProgressPatients,
  isDraggable,
  selectedCategory,
  draggedPatientId,
  selectedPatient,
  onSelectQueuePatient,
  onPointerDown,
  onDragStart,
  onSpeak,
  onAssignNow,
  speakingId,
  warnAfterSeconds,
}: QueuePanelProps) {
  const safeQueue = Array.isArray(onProgressPatients) ? onProgressPatients : [];

  return (
    <div className={queuePanelStyles.container}>
      {/* Tab Switcher Header */}
      <div className={queuePanelStyles.tabHeader}>
        <button
          type="button"
          className={queuePanelStyles.tabActive}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="whitespace-normal">{transferTexts.queueTabTitle}</span>
          <NotificationBadge
            count={safeQueue.length}
            color="gray"
            className="shrink-0"
          />
        </button>

        <p className="px-3 py-2 text-xs text-slate-500 whitespace-normal">Counts reset at 1 PM. Tickets cancel after more than five rotations.</p>
      </div>

      {/* Tab Content (Fills remaining height) */}
      <div className={queuePanelStyles.tabBody}>
          <OnProgressSection
            patients={safeQueue}
            isDraggable={isDraggable}
            selectedCategory={selectedCategory}
            draggedPatientId={draggedPatientId}
            selectedPatient={selectedPatient}
            onSelectPatient={onSelectQueuePatient}
            onPointerDown={onPointerDown}
            onDragStart={onDragStart}
            onSpeak={onSpeak}
            onAssignNow={onAssignNow}
            speakingId={speakingId}
            warnAfterSeconds={warnAfterSeconds}
          />
      </div>
    </div>
  );
}

export default QueuePanel;
