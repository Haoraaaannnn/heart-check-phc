'use client';
import { Patient } from '../types';
import { ElapsedTimer } from './ElapsedTimer';

type AssignedSectionProps = {
  patients: Patient[];
  speakingId: number | null;
  onCall: (patient: Patient) => void;
  onMoveToWithDoctor: (patient: Patient) => void;
};

export function AssignedSection({ patients, speakingId, onCall, onMoveToWithDoctor }: AssignedSectionProps) {
  return (
    <div className="bg-white border-2 border-blue-100 rounded-3xl shadow-sm p-5">
      <h2 className="text-blue-500 font-semibold text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block"></span>
        In Queue / Assigned ({patients.length})
      </h2>
      {patients.length === 0 && (
        <p className="text-gray-300 text-xs">No patients assigned</p>
      )}
      {patients.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {patients.map(p => (
            <div key={p.id} className="border border-blue-100 rounded-2xl p-3 flex flex-col gap-2 bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-[#cc3535] font-black text-lg">{p.patientNum}</span>
                <span className="text-xs text-gray-500">{p.cubicleNum}</span>
              </div>
              <span className="text-gray-500 text-xs font-medium">{p.service}</span>
              {p.queue_start && (
                <div className="text-xs text-gray-400">
                  Queue: <ElapsedTimer startedAt={p.queue_start} />
                </div>
              )}
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => onCall(p)}
                  disabled={speakingId === p.id}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium transition ${
                    speakingId === p.id ? 'bg-blue-100 text-blue-300 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-500'
                  }`}
                >
                  <i className={`bx ${speakingId === p.id ? 'bx-loader-alt animate-spin' : 'bxs-volume-full'} text-xs`}></i>
                  <span>Call</span>
                </button>
                <button
                  onClick={() => onMoveToWithDoctor(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-600 transition"
                >
                  <i className="bx bx-user-plus text-xs"></i>
                  <span>With Doctor</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}