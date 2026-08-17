'use client';

import { Patient } from '@/types/Types';

type CarryoutSectionProps = {
  patients: Patient[];
  onMoveBack: (patient: Patient) => void;
  onFinish: (patient: Patient) => void;
};

export function CarryoutSection({
  patients,
  onMoveBack,
  onFinish,
}: CarryoutSectionProps) {
  return (
    <div className="bg-white border-2 border-orange-100 rounded-3xl shadow-sm p-5">
      <h2 className="text-orange-500 font-semibold text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
        Carryout ({patients.length})
      </h2>

      {patients.length === 0 ? (
        <p className="text-gray-300 text-xs">No patients for carryout</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="border border-orange-100 rounded-2xl p-3 flex flex-col gap-2 bg-orange-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#cc3535] font-black text-lg">
                  {patient.patientNum}
                </span>
                <span className="text-xs text-gray-500">
                  {patient.cubicleNum}
                </span>
              </div>

              <span className="text-gray-500 text-xs font-medium">
                {patient.service}
              </span>

              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => onMoveBack(patient)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition"
                >
                  <i className="bx bx-undo text-xs" />
                  <span>Back</span>
                </button>

                <button
                  onClick={() => onFinish(patient)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium bg-green-50 hover:bg-green-100 text-green-500 transition"
                >
                  <i className="bx bx-check text-sm" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}