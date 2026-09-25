'use client';

import React, { useState } from 'react';
import { Patient } from '@/types/Types';
import { OnProgressSection } from './OnProgressSection';
import { IdleNumbersPanel } from './IdleNumbersPanel';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { transferTexts } from '../constants/transferTexts';

/**
 * Props for `QueuePanel`.
 */
export interface QueuePanelProps {
  /** Active queue patients. */
  onProgressPatients: Patient[];
  /** Idle patients list. */
  idlePatients: Patient[];
  /** Whether drag-and-drop assignment is enabled. */
  isDraggable: boolean;
  /** Active service category name. */
  selectedCategory: string | null;
  /** ID of patient currently being dragged. */
  draggedPatientId?: number;
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
 * @remarks
 * Replaces the old side-by-side QueueAndIdleLayout with a space-efficient tabbed interface,
 * capped scroll heights, and real-time badge counters.
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Tab Switcher Header */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{transferTexts.queueTabTitle}</span>
          <NotificationBadge
            count={onProgressPatients.length}
            color={activeTab === 'queue' ? 'brand' : 'gray'}
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('idle')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'idle'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>{transferTexts.idleTabTitle}</span>
          <NotificationBadge
            count={idlePatients.length}
            color="gray"
          />
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3">
        {activeTab === 'queue' ? (
          <OnProgressSection
            patients={onProgressPatients}
            isDraggable={isDraggable}
            selectedCategory={selectedCategory}
            draggedPatientId={draggedPatientId}
            onPointerDown={onPointerDown}
            onDragStart={onDragStart}
            onSpeak={onSpeak}
            onAssignNow={onAssignNow}
            speakingId={speakingId}
            warnAfterSeconds={warnAfterSeconds}
            compact
          />
        ) : (
          <IdleNumbersPanel
            patients={idlePatients}
            onActivate={onActivateIdle}
            onRemove={onRemoveIdle}
            compact
          />
        )}
      </div>
    </div>
  );
}

export default QueuePanel;
