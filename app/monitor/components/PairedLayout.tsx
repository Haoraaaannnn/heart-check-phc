'use client';
import { Patient } from '@/types/Types';

type PairedLayoutProps = {
  title: string;
  pairedData: { patient: Patient | null; cubicle: string }[];
  formatCubicleDisplay: (cubicleNum: string) => string;
  cubicleDoctorMap?: Record<string, string>;
};

export function PairedLayout({ title, pairedData, formatCubicleDisplay, cubicleDoctorMap = {} }: PairedLayoutProps) {
  return (
    <div className="p-12">
      {pairedData.length === 0 ? (
        <div className="flex items-center justify-center h-[70vh]">
          <p className="text-gray-300 text-5xl font-bold">No patients being served</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <h2 className="text-gray-600 text-3xl font-bold text-center">Queue Number</h2>
            <h2 className="text-gray-600 text-3xl font-bold text-center">Cubicle / Room</h2>
          </div>
          <div className="space-y-4">
            {pairedData.map((pair, index) => {
              const doctorName = pair.cubicle ? cubicleDoctorMap[pair.cubicle] : undefined;
              return (
                <div key={index} className="grid grid-cols-2 gap-8">
                  <div className={`rounded-3xl flex flex-col items-center justify-center gap-1 transition-all ${
                    index === 0
                      ? 'bg-[#cc3535] shadow-2xl shadow-red-300 ring-[6px] ring-red-100 scale-105 min-h-[180px] p-8'
                      : 'bg-white border-2 border-gray-100 min-h-[120px] p-6 opacity-70'
                  }`}>
                    {pair.patient ? (
                      <>
                        {index === 0 && (
                          <span className="text-white/80 text-base font-black uppercase tracking-widest">
                            Now Serving
                          </span>
                        )}
                        <span className={`font-black tabular-nums drop-shadow-md ${
                          index === 0 ? 'text-white text-8xl' : 'text-gray-400 text-3xl'
                        }`}>
                          {pair.patient.patientNum}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-300 text-3xl">—</span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 shadow-md border-2 border-gray-100 flex flex-col items-center justify-center min-h-[120px]">
                    {pair.cubicle ? (
                      <>
                        <span className="text-gray-700 font-bold text-3xl">
                          {formatCubicleDisplay(pair.cubicle)}
                        </span>
                        {doctorName && (
                          <span className="text-gray-400 text-lg mt-1">Dr. {doctorName}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300 text-3xl">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}