/**
 * @fileoverview Unified tabbed panel hosting active queue and idle numbers list.
 *
 * Sized to fill the left dashboard column, providing a space-efficient tabbed interface
 * whose patient lists scroll internally while the outer container remains non-scrollable.
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/QueuePanel
 */

'use client';

import React, { useState } from 'react';
import { Patient } from '@/types/Types';
import { OnProgressSection } from '@/app/transfer/components/OnProgressSection';
import { IdleNumbersPanel } from '@/app/transfer/components/IdleNumbersPanel';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { transferTexts } from '@/constants/texts/transferTexts';
import { SelectedTransferPatient } from '@/app/transfer/types/transfer';
import { queuePanelStyles } from '@/constants/designs/transferStyles';

/**
 * Props for {@link QueuePanel}.
 */
export interface QueuePanelProps {
  /** Active queue patients. */
  onProgressPatients: Patient[];
  /** Idle patients list. */
  idlePatients: Patient[];
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
  /** Callback to restore an idle patient. */
  onActivateIdle: (patient: Patient) => void;
  /** Callback to dismiss an idle patient. */
  onRemoveIdle: (patient: Patient) => void;
  /** Collapses this panel while the parent preserves its state and queue synchronization. */
  onHide?: () => void;
  /** Identifier of the collapsible queue column for accessible controls. */
  panelId?: string;
}

/**
 * Unified tabbed panel hosting both the active queue and idle numbers list.
 *
 * @param props - Queue and idle data with user action handlers.
 * @returns The rendered tabbed panel component.
 */
export function QueuePanel({
  onProgressPatients,
  idlePatients,
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
  onActivateIdle,
  onRemoveIdle,
  onHide,
  panelId,
}: QueuePanelProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'idle'>('queue');
  const safeQueue = Array.isArray(onProgressPatients) ? onProgressPatients : [];
  const safeIdle = Array.isArray(idlePatients) ? idlePatients : [];

  return (
    <div className={queuePanelStyles.container}>
      {/* Tab Switcher Header */}
      <div className={queuePanelStyles.tabHeader}>
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={
            activeTab === 'queue'
              ? queuePanelStyles.tabActive
              : queuePanelStyles.tabInactive
          }
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="whitespace-normal">{transferTexts.queueTabTitle}</span>
          <NotificationBadge
            count={safeQueue.length}
            color={activeTab === 'queue' ? 'brand' : 'gray'}
            className="shrink-0"
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('idle')}
          className={
            activeTab === 'idle'
              ? queuePanelStyles.tabActive
              : queuePanelStyles.tabInactive
          }
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          <span className="whitespace-normal">{transferTexts.idleTabTitle}</span>
          <NotificationBadge
            count={safeIdle.length}
            color="gray"
            className="shrink-0"
          />
        </button>

        {onHide && <button type="button" onClick={onHide} aria-label="Hide On Progress and Idle panel"
          aria-controls={panelId} aria-expanded={true} title="Hide On Progress and Idle panel"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          <i className="bx bx-chevrons-left text-base" aria-hidden="true" />{transferTexts.hide}
        </button>}
      </div>

      {/* Tab Content (Fills remaining height) */}
      <div className={queuePanelStyles.tabBody}>
        {activeTab === 'queue' ? (
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
        ) : (
          <IdleNumbersPanel
            patients={safeIdle}
            onActivate={onActivateIdle}
            onRemove={onRemoveIdle}
          />
        )}
      </div>
    </div>
  );
}

export default QueuePanel;
