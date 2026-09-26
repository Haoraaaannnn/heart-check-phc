/**
 * @fileoverview Unified tabbed panel hosting active queue and idle numbers list.
 *
 * Sized to fill the left dashboard column, providing a space-efficient tabbed interface
 * whose patient lists scroll internally while the outer container remains non-scrollable.
 *
 * @module app/transfer/components/QueuePanel
 */

'use client';

import React, { useState } from 'react';
import { Patient } from '@/types/Types';
import { OnProgressSection } from './OnProgressSection';
import { IdleNumbersPanel } from './IdleNumbersPanel';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { transferTexts } from '../constants/transferTexts';
import { SelectedTransferPatient } from '../types/transfer';

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
}: QueuePanelProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'idle'>('queue');
  const safeQueue = Array.isArray(onProgressPatients) ? onProgressPatients : [];
  const safeIdle = Array.isArray(idlePatients) ? idlePatients : [];

  return (
    <div className="h-full flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Tab Switcher Header */}
      <div className="shrink-0 flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{transferTexts.queueTabTitle}</span>
          <NotificationBadge
            count={safeQueue.length}
            color={activeTab === 'queue' ? 'brand' : 'gray'}
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('idle')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'idle'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>{transferTexts.idleTabTitle}</span>
          <NotificationBadge
            count={safeIdle.length}
            color="gray"
          />
        </button>
      </div>

      {/* Tab Content (Fills remaining height) */}
      <div className="flex-1 min-h-0 p-2.5 flex flex-col overflow-hidden">
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
