'use client';
import { Patient } from '@/types/Types';
import { IdleNumbersSection } from './IdleNumbersSection';
import { OnProgressSection } from './OnProgressSection';

type QueueAndIdleLayoutProps = {
  onProgressPatients: Patient[];
  idlePatients: Patient[];
  isDraggable: boolean;
  selectedCategory: string | null;
  draggedPatientId?: number;
  onDragStart: (e: React.MouseEvent, patient: Patient) => void;
  onSpeak: (text: string, patientId: number) => void;
  onAssignNow?: (patient: Patient) => void;
  speakingId?: number | null;
  warnAfterSeconds?: number;
  onActivateIdle: (patient: Patient) => void;
  onRemoveIdle: (patient: Patient) => void;
};

export function QueueAndIdleLayout({
  onProgressPatients,
  idlePatients,
  isDraggable,
  selectedCategory,
  draggedPatientId,
  onDragStart,
  onSpeak,
  onAssignNow,
  speakingId,
  warnAfterSeconds,
  onActivateIdle,
  onRemoveIdle,
}: QueueAndIdleLayoutProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <OnProgressSection
        patients={onProgressPatients}
        isDraggable={isDraggable}
        selectedCategory={selectedCategory}
        draggedPatientId={draggedPatientId}
        onDragStart={onDragStart}
        onSpeak={onSpeak}
        onAssignNow={onAssignNow}
        speakingId={speakingId}
        warnAfterSeconds={warnAfterSeconds}
        compact
      />
      <IdleNumbersSection
        patients={idlePatients}
        onActivate={onActivateIdle}
        onRemove={onRemoveIdle}
        compact
      />
    </div>
  );
}