'use client';
import { Patient, Cubicle } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { ElapsedTimer } from './ElapsedTimer';

type CubicleCardProps = {
  cubicle: Cubicle;
  assigned: Patient[];
  isOver: boolean;
  isDraggable: boolean;
  isFull: boolean;
  onDragStart: (e: React.MouseEvent, patient: Patient, cubicleNum: string) => void;
  onSpeak: (text: string, patientId: number) => void;
  onMoveBack: (patient: Patient, cubicleNum: string) => void;
  draggedPatientId?: number;
  speakingId?: number | null;
  warnAfterSeconds?: number;
};

export function CubicleCard({
  cubicle,
  assigned,
  isOver,
  isDraggable,
  isFull,
  onDragStart,
  onSpeak,
  onMoveBack,
  draggedPatientId,
  speakingId,
  warnAfterSeconds,
}: CubicleCardProps) {
  return (
    <div
      data-cubicle={cubicle.cubicleNum}
      className={`bg-white border-2 rounded-3xl p-4 flex flex-col gap-2 min-h-36 shadow-sm transition-all duration-150 ${
        isOver && isDraggable ? 'border-[#cc3535] bg-red-50 scale-105' : 
        isFull ? 'border-red-300 bg-red-50/30' : 'border-gray-100 hover:border-red-200'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="text-gray-700 font-semibold text-xs">{cubicle.cubicleNum}</span>
        <span className={`text-xs font-medium ${isFull ? 'text-red-500' : 'text-gray-400'}`}>
          {assigned.length}/{MAX_PATIENTS_PER_CUBICLE}
        </span>
      </div>
      {assigned.length === 0 && <p className="text-gray-300 text-xs">Drop patient here</p>}
      {isFull && <p className="text-red-400 text-xs">Full - No more patients can be assigned</p>}
      <div className="flex flex-col gap-1">
      {assigned.map((p, index) => (
        <div key={p.id} className="flex items-center gap-1">
          <span
            onMouseDown={isDraggable ? (e) => onDragStart(e, p, cubicle.cubicleNum) : undefined}
            className={`px-2 py-1 bg-[#cc3535] text-white rounded-full text-xs font-medium select-none ${
              isDraggable ? (draggedPatientId === p.id ? 'opacity-40 cursor-grabbing' : 'cursor-grab') : ''
            }`}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {p.patientNum}
          </span>
          {index === 0 && (
            <ElapsedTimer startedAt={p.cubicle_top_started_at} warnAfterSeconds={warnAfterSeconds} />
          )}
          <button
            onClick={() => {
              const num = p.patientNum;
              const letter = num.charAt(0);
              const digits = parseInt(num.slice(1), 10).toString();
              onSpeak(`Number ${letter} ${digits}, Number ${letter} ${digits}, go to ${cubicle.cubicleNum}`, p.id);
            }}
            disabled={speakingId === p.id}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition shrink-0 ${
              speakingId === p.id ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200 text-blue-500'
            }`}
          >
            <i className={`bx ${speakingId === p.id ? 'bx-loader-alt animate-spin' : 'bxs-volume-full'} text-xs`}></i>
          </button>
          <button
            onClick={() => onMoveBack(p, cubicle.cubicleNum)}
            title="Move back to queue"
            className="w-5 h-5 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-full flex items-center justify-center transition shrink-0"
          >
            <i className="bx bx-undo text-xs"></i>
          </button>
        </div>
      ))}
      </div>
    </div>
  );
}