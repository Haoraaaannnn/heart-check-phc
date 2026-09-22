'use client';
import { Cubicle, Patient } from '@/types/Types';
import { CubicleCard } from './CubicleCard';
import { RegistrationCounterSection } from './RegistrationCounterSection';
import { QueueAndIdleLayout } from './QueueAndIdleLayout';

type OPScreeningFlowProps = {
  selectedSubcategory: string | null;
  onSelectSubcategory: (sub: string) => void;
  selectedRoom: number | null;
  rooms: number[];
  visibleCubicles: Cubicle[];
  visibleOnProgress: any[];
  assignedPatients: Record<string, any[]>;
  draggedPatient: any;
  dragOverCubicle: string | null;
  speaking: number | null;
  onSelectRoom: (room: number) => void;
  onDragStartFromQueue: (e: React.MouseEvent, patient: any) => void;
  onDragStartFromCubicle: (e: React.MouseEvent, patient: any, cubicleNum: string) => void;
  onSpeak: (text: string, patientId: number) => void;
  onMoveBackToProgress: (patient: any, cubicleNum: string) => void;
  isDragEnabled: boolean;
  registrationPatients: Patient[];
  regDraggedPatient: Patient | null;
  dragOverCounter: number | null;
  onRegDragStart: (e: React.MouseEvent, patient: Patient) => void;
  cubicleDoctorMap?: Record<string, string>;
  onReleaseFromCounter: (patient: Patient) => void;
  onAssignNow: (patient: Patient) => void;
  idlePatients: Patient[];
  onActivateIdle: (patient: Patient) => void;
  onRemoveIdle: (patient: Patient) => void;
  allowedCounters?: number[];
  allowedSubcategories?: string[];
};

export function OPScreeningFlow({
  selectedSubcategory,
  onSelectSubcategory,
  selectedRoom,
  rooms,
  visibleCubicles,
  visibleOnProgress,
  assignedPatients,
  draggedPatient,
  dragOverCubicle,
  speaking,
  onSelectRoom,
  onDragStartFromQueue,
  onDragStartFromCubicle,
  onSpeak,
  onMoveBackToProgress,
  isDragEnabled,
  registrationPatients,
  regDraggedPatient,
  dragOverCounter,
  onRegDragStart,
  cubicleDoctorMap = {},
  onReleaseFromCounter,
  onAssignNow,
  idlePatients,
  onActivateIdle,
  onRemoveIdle,
  allowedCounters,
  allowedSubcategories,
}: OPScreeningFlowProps) {
  if (!selectedSubcategory) {
    const countFor = (sub: string) => ({
      queue: visibleOnProgress.filter(p => p.subcategory === sub).length,
      idle: idlePatients.filter(p => p.subcategory === sub).length,
      registration: registrationPatients.filter(p => p.subcategory === sub).length,
    });

    const Subcard = ({ sub, icon }: { sub: string; icon: string }) => {
      const counts = countFor(sub);
      const total = counts.queue + counts.idle + counts.registration;
      return (
        <button onClick={() => onSelectSubcategory(sub)}
          className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <i className={`bx ${icon} text-xl text-[#cc3535]`}></i>
            </div>
            {total > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#cc3535]">
                {total}
              </span>
            )}
          </div>
          <span className="text-gray-700 font-semibold text-sm">{sub}</span>
          {total > 0 && (
            <span className="text-[11px] text-gray-400">
              {counts.queue > 0 && `${counts.queue} in queue`}
              {counts.queue > 0 && (counts.registration > 0 || counts.idle > 0) && ' · '}
              {counts.registration > 0 && `${counts.registration} at counter`}
              {counts.registration > 0 && counts.idle > 0 && ' · '}
              {counts.idle > 0 && `${counts.idle} idle`}
            </span>
          )}
        </button>
      );
    };

    const ALL_SUBCATEGORIES = [
      { sub: 'Adult', icon: 'bx-male' },
      { sub: 'Pedia', icon: 'bx-child' },
    ];
    const visibleSubcategories = allowedSubcategories !== undefined
      ? ALL_SUBCATEGORIES.filter(s => allowedSubcategories.includes(s.sub))
      : ALL_SUBCATEGORIES;

    if (visibleSubcategories.length === 0) {
      return (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center max-w-md mx-auto mt-8">
          <i className="bx bx-info-circle text-4xl text-amber-500 mb-2 block"></i>
          <p className="text-gray-600 font-medium">No OPD Screening rooms assigned to your account</p>
          <p className="text-gray-400 text-sm mt-1">Ask a Super Admin to assign a room before you can manage patients here.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-8">
        {visibleSubcategories.map(({ sub, icon }) => (
          <Subcard key={sub} sub={sub} icon={icon} />
        ))}
      </div>
    );
  }

  if (!selectedRoom) {
    if (rooms.length === 0) {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-8 text-center">
          <i className="bx bx-info-circle text-4xl text-yellow-500 mb-2 block"></i>
          <p className="text-gray-600 font-medium">No rooms configured for OPD Screening ({selectedSubcategory})</p>
          <p className="text-gray-400 text-sm mt-1">Please add cubicles with category "OPD Screening" and subcategory "{selectedSubcategory}" to the database</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {rooms.map(room => {
          const roomCubicles = visibleCubicles.filter(c => c.room === room);
          const totalAssigned = roomCubicles.reduce((sum, c) => sum + (assignedPatients[c.cubicleNum]?.length ?? 0), 0);
          return (
            <button key={room} onClick={() => onSelectRoom(room)}
              className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left">
              <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
                <i className="bx bx-door-open text-xl text-[#cc3535]"></i>
              </div>
              <span className="text-gray-700 font-semibold text-sm">Room {room}</span>
              {totalAssigned > 0 && <span className="text-xs text-orange-400 font-medium">{totalAssigned} assigned</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <RegistrationCounterSection
        patients={registrationPatients}
        draggedPatient={regDraggedPatient}
        dragOverCounter={dragOverCounter}
        onDragStart={onRegDragStart}
        onRelease={onReleaseFromCounter}
        allowedCounters={allowedCounters}
      />
      <div className="mt-4">
        <QueueAndIdleLayout
          onProgressPatients={visibleOnProgress}
          idlePatients={idlePatients}
          isDraggable={isDragEnabled}
          selectedCategory="OPD Screening"
          draggedPatientId={draggedPatient?.id}
          onDragStart={onDragStartFromQueue}
          onSpeak={onSpeak}
          onAssignNow={onAssignNow}
          speakingId={speaking}
          onActivateIdle={onActivateIdle}
          onRemoveIdle={onRemoveIdle}
        />
      </div>
      <div className="grid grid-cols-5 gap-3 mt-4">
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
            doctorName={cubicleDoctorMap[cubicle.cubicleNum]}
          />
        ))}
      </div>
    </>
  );
}