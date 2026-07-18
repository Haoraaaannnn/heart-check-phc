'use client';
import { Patient, Cubicle } from '@/types/Types';

type TableLayoutProps = {
  title: string;
  cubicles: Cubicle[];
  assignedPatients: Patient[];
  formatCubicleDisplay: (cubicleNum: string) => string;
  cubicleDoctorMap?: Record<string, string>;
};

const formatCubicleOnly = (cubicleNum: string): string => {
  const cubicleMatch = cubicleNum.match(/C(\d+)$/);
  return cubicleMatch ? `Cubicle ${cubicleMatch[1]}` : cubicleNum;
};

export function TableLayout({ title, cubicles, assignedPatients, formatCubicleDisplay, cubicleDoctorMap = {} }: TableLayoutProps) {
  const uniqueRooms = [...new Set(cubicles.map(c => c.room))].sort((a, b) => a - b);

  return (
    <div className="p-12">
      {assignedPatients.length === 0 ? (
        <div className="flex items-center justify-center h-[70vh]">
          <p className="text-gray-300 text-5xl font-bold">No patients being served</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="px-6 py-5 text-left text-gray-600 text-xl font-semibold uppercase tracking-wider">
                  Room / Cubicle
                </th>
                {cubicles.map((cubicle) => {
                  const displayName = formatCubicleOnly(cubicle.cubicleNum);
                  const doctorName = cubicleDoctorMap[cubicle.cubicleNum];
                  return (
                    <th key={cubicle.id} className="px-6 py-5 text-center text-gray-600 text-xl font-semibold uppercase tracking-wider border-l border-gray-200">
                      <div>{displayName}</div>
                      {doctorName && (
                        <div className="text-sm font-normal normal-case text-gray-400 mt-1">
                          Dr. {doctorName}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {uniqueRooms.map((room) => {
                const roomCubicles = cubicles.filter(c => c.room === room);
                return (
                  <tr key={room} className="border-b border-gray-100">
                    <td className="px-6 py-8 font-bold text-gray-700 text-2xl bg-gray-50">
                      Room {room}
                    </td>
                    {roomCubicles.map((cubicle) => {
                      const patientsInCubicle = assignedPatients.filter(p => p.cubicleNum === cubicle.cubicleNum);
                      const sortedPatients = [...patientsInCubicle].sort((a, b) =>
                        new Date(a.called_at || 0).getTime() - new Date(b.called_at || 0).getTime()
                      );
                      return (
                        <td key={cubicle.id} className="px-6 py-8 text-center border-l border-gray-100 align-top">
                          <div className="space-y-3">
                            {sortedPatients.length === 0 ? (
                              <div className="text-gray-300 text-xl">—</div>
                            ) : (
                              sortedPatients.map((patient, idx) => (
                                <div
                                  key={patient.id}
                                  className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between gap-3 ${
                                    idx === 0 ? 'border-[#cc3535] border-2' : 'border-gray-100'
                                  }`}
                                >
                                  <span className="text-[#cc3535] font-black text-3xl tabular-nums">
                                    {patient.patientNum}
                                  </span>
                                  {idx === 0 && (
                                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}