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

export function TableLayout({ cubicles, assignedPatients, cubicleDoctorMap = {} }: TableLayoutProps) {
  const uniqueRooms = [...new Set(cubicles.map(c => c.room))].sort((a, b) => a - b);

  if (assignedPatients.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-300 text-[clamp(24px,6vh,64px)] font-bold">No patients being served</p>
      </div>
    );
  }

  const maxCols = Math.max(1, ...uniqueRooms.map(r => cubicles.filter(c => c.room === r).length));
  const numFont = `min(${Math.max(2, 24 / (maxCols + 1))}vw, ${Math.max(4, 40 / uniqueRooms.length)}vh)`;
  const smallFont = `min(${Math.max(1.2, 9 / (maxCols + 1))}vw, 3vh)`;

  return (
    <div className="h-full p-[clamp(10px,2vh,36px)]">
      <table className="w-full h-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-[#1f1f1f] border-b-2 border-gray-200 dark:border-[#2e2e2e]">
            <th className="w-[12%] px-2 py-[1vh] text-left text-gray-600 dark:text-[#d4d4d4] text-[clamp(10px,2vh,22px)] font-semibold uppercase tracking-wider">
              Room / Cubicle
            </th>
            {cubicles.map(cubicle => {
              const doctorName = cubicleDoctorMap[cubicle.cubicleNum];
              const label = cubicle.cubicleNum.match(/C(\d+)$/);
              return (
                <th key={cubicle.id} className="px-2 py-[1vh] text-center border-l border-gray-200 dark:border-[#2e2e2e] text-gray-600 dark:text-[#d4d4d4] text-[clamp(10px,2vh,22px)] font-semibold uppercase tracking-wider overflow-hidden">
                  <div>{label ? `Cubicle ${label[1]}` : cubicle.cubicleNum}</div>
                  {doctorName && (
                    <div className="font-normal normal-case text-gray-400 text-[clamp(9px,1.5vh,16px)] break-words">
                      Dr. {doctorName}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {uniqueRooms.map(room => {
            const roomCubicles = cubicles.filter(c => c.room === room);
            return (
              <tr key={room} className="border-b border-gray-100 dark:border-[#2e2e2e]" style={{ height: `${100 / uniqueRooms.length}%` }}>
                <td className="px-2 font-bold text-gray-700 dark:text-[#f5f5f5] text-[clamp(14px,3vh,30px)] bg-gray-50 dark:bg-[#1a1a1a] align-middle">
                  Room {room}
                </td>
                {roomCubicles.map(cubicle => {
                  const list = assignedPatients
                    .filter(p => p.cubicleNum === cubicle.cubicleNum)
                    .sort((a, b) => new Date(a.called_at || 0).getTime() - new Date(b.called_at || 0).getTime());
                  const [top, ...rest] = list;
                  return (
                    <td key={cubicle.id} className="border-l border-gray-100 dark:border-[#2e2e2e] align-middle text-center overflow-hidden p-[0.6vh]">
                      {!top ? (
                        <span className="text-gray-300" style={{ fontSize: smallFont }}>—</span>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-[0.6vh] overflow-hidden">
                          <div className="w-full bg-[#cc3535] rounded-2xl ring-4 ring-red-100 shadow-lg py-[1vh] flex flex-col items-center">
                            <span className="text-white/80 font-black uppercase tracking-widest" style={{ fontSize: smallFont }}>Now Serving</span>
                            <span className="text-white font-black tabular-nums leading-none" style={{ fontSize: numFont }}>{top.patientNum}</span>
                          </div>
                          {rest.length > 0 && (
                            <div className="flex flex-wrap items-center justify-center gap-x-2 text-gray-400 font-black tabular-nums" style={{ fontSize: smallFont }}>
                              {rest.slice(0, 2).map(p => <span key={p.id}>{p.patientNum}</span>)}
                              {rest.length > 2 && <span>+{rest.length - 2}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}