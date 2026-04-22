'use client';
import { Cubicle } from '../types';
import { CubicleCard } from './CubicleCard';
import { OnProgressSection } from './OnProgressSection';

type OtherServicesFlowProps = {
  visibleCubicles: Cubicle[];
  visibleOnProgress: any[];
  assignedPatients: Record<string, any[]>;
  draggedPatient: any;
  dragOverCubicle: string | null;
  speaking: number | null;
  selectedCategory: string;
  onDragStartFromQueue: (e: React.MouseEvent, patient: any) => void;
  onDragStartFromCubicle: (e: React.MouseEvent, patient: any, cubicleNum: string) => void;
  onSpeak: (text: string, patientId: number) => void;
  onMoveBackToProgress: (patient: any, cubicleNum: string) => void;
  isDragEnabled: boolean;
};

export function OtherServicesFlow({
  visibleCubicles,
  visibleOnProgress,
  assignedPatients,
  draggedPatient,
  dragOverCubicle,
  speaking,
  selectedCategory,
  onDragStartFromQueue,
  onDragStartFromCubicle,
  onSpeak,
  onMoveBackToProgress,
  isDragEnabled,
}: OtherServicesFlowProps) {
  return (
    <>
      <OnProgressSection
        patients={visibleOnProgress}
        isDraggable={isDragEnabled}
        selectedCategory={selectedCategory}
        draggedPatientId={draggedPatient?.id}
        onDragStart={onDragStartFromQueue}
        onSpeak={onSpeak}
        speakingId={speaking}
      />
      <div className={`grid ${visibleCubicles.length === 5 ? 'grid-cols-5' : 'grid-cols-3'} gap-3 mt-4`}>
        {visibleCubicles.map(cubicle => (
          <CubicleCard
            key={cubicle.id}
            cubicle={cubicle}
            assigned={assignedPatients[cubicle.cubicleNum] || []}
            isOver={dragOverCubicle === cubicle.cubicleNum}
            isDraggable={isDragEnabled}
            isFull={(assignedPatients[cubicle.cubicleNum]?.length || 0) >= 5}
            onDragStart={onDragStartFromCubicle}
            onSpeak={onSpeak}
            onMoveBack={onMoveBackToProgress}
            draggedPatientId={draggedPatient?.id}
            speakingId={speaking}
          />
        ))}
      </div>
    </>
  );
}