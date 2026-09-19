'use client';
import { Patient } from '@/types/Types';
import { ElapsedTimer } from './ElapsedTimer';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';

type OnProgressSectionProps = {
  patients: Patient[];
  isDraggable: boolean;
  selectedCategory: string | null;
  draggedPatientId?: number;
  onDragStart: (e: React.MouseEvent, patient: Patient) => void;
  onSpeak: (text: string, patientId: number) => void;
  onAssignNow?: (patient: Patient) => void;
  speakingId?: number | null;
  warnAfterSeconds?: number;
  compact?: boolean;
};

export function OnProgressSection({
  patients,
  isDraggable,
  selectedCategory,
  draggedPatientId,
  onDragStart,
  onSpeak,
  onAssignNow,
  speakingId,
  warnAfterSeconds,
  compact,
}: OnProgressSectionProps) {
  return (
    <div className={`bg-white border-2 border-green-100 rounded-3xl shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <h2 className="text-green-500 font-semibold text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        On Progress Queue ({patients.length})
        {isDraggable && (
          <span className="text-xs text-gray-400 font-normal ml-2">(Drag to cubicles)</span>
        )}
        {!isDraggable && (
          <span className="text-xs text-blue-400 font-normal ml-2">(Auto-assigning)</span>
        )}
      </h2>
      {patients.length === 0 && (
        <p className="text-gray-300 text-xs">No patients in queue</p>
      )}
      {patients.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
          {patients.map((p, index) => (
            <div
              key={p.id}
              onMouseDown={isDraggable ? (e) => onDragStart(e, p) : undefined}
              className={`flex items-center justify-between border rounded-xl px-3 py-2 select-none transition ${
                index < 5
                  ? 'border-green-200 bg-green-50'
                  : 'border-yellow-200 bg-yellow-50'
              } ${isDraggable ? (draggedPatientId === p.id ? 'opacity-40 cursor-grabbing' : 'cursor-grab') : ''}`}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#cc3535] font-black text-sm">{p.patientNum}</span>
                <span className="text-gray-500 text-xs truncate">
                  {p.service}{p.subcategory && ` · ${p.subcategory}`}
                </span>
                <span className="text-[10px] text-gray-400">
                  #{index + 1}
                </span>
                <ElapsedTimer startedAt={p.progress_started_at} warnAfterSeconds={warnAfterSeconds} />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const num = p.patientNum;
                    const letter = num.charAt(0);
                    const digits = parseInt(num.slice(1), 10).toString();
                    onSpeak(`Number ${letter} ${digits}, Number ${letter} ${digits}, go to the ${selectedCategory || 'consultation'} area`, p.id);
                  }}
                  disabled={speakingId === p.id}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
                    speakingId === p.id ? 'bg-blue-100 text-blue-300 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-500'
                  }`}
                  title="Call"
                >
                  <i className={`bx ${speakingId === p.id ? 'bx-loader-alt animate-spin' : 'bxs-volume-full'} text-sm`}></i>
                </button>

                {isDraggable && onAssignNow && (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignNow(p);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-green-50 hover:bg-green-100 text-green-600 transition"
                    title="Assign Now"
                  >
                    <i className="bx bx-check-circle text-sm"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}