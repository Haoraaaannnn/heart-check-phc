'use client';
import { Patient } from '@/types/Types';

type PairedLayoutProps = {
  title: string;
  pairedData: { patient: Patient | null; cubicle: string }[];
  formatCubicleDisplay: (cubicleNum: string) => string;
  cubicleDoctorMap?: Record<string, string>;
};

export function PairedLayout({ pairedData, formatCubicleDisplay, cubicleDoctorMap = {} }: PairedLayoutProps) {
  if (pairedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-300 text-[clamp(24px,6vh,64px)] font-bold">No patients being served</p>
      </div>
    );
  }

  const rows = pairedData.length;
  const rowVh = 68 / rows;                       // approx vh available per row
  const numFont = `${Math.min(9, rowVh * 0.55)}vh`;
  const subFont = `${Math.min(3.2, rowVh * 0.25)}vh`;

  return (
    <div className="h-full flex flex-col p-[clamp(10px,2vh,36px)] gap-[clamp(6px,1.2vh,16px)] max-w-[1800px] mx-auto">
      <div className="shrink-0 grid grid-cols-2 gap-[2vw]">
        <h2 className="text-gray-600 dark:text-[#d4d4d4] text-[clamp(14px,3vh,32px)] font-bold text-center">Queue Number</h2>
        <h2 className="text-gray-600 dark:text-[#d4d4d4] text-[clamp(14px,3vh,32px)] font-bold text-center">Cubicle / Room</h2>
      </div>

      <div
        className="flex-1 min-h-0 grid gap-[clamp(4px,1vh,14px)]"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {pairedData.map((pair, index) => {
          const doctorName = pair.cubicle ? cubicleDoctorMap[pair.cubicle] : undefined;
          const first = index === 0;
          return (
            <div key={index} className="grid grid-cols-2 gap-[2vw] min-h-0">
              <div
                className={`rounded-3xl flex flex-col items-center justify-center overflow-hidden min-h-0 ${
                  first
                    ? 'bg-[#cc3535] shadow-xl shadow-red-300 ring-4 ring-red-100'
                    : 'bg-white dark:bg-[#1a1a1a] border-2 border-gray-100 dark:border-[#2e2e2e] opacity-80'
                }`}
              >
                {pair.patient ? (
                  <>
                    {first && (
                      <span className="text-white/80 font-black uppercase tracking-widest" style={{ fontSize: subFont }}>
                        Now Serving
                      </span>
                    )}
                    <span
                      className={`font-black tabular-nums leading-none ${first ? 'text-white' : 'text-gray-400'}`}
                      style={{ fontSize: numFont }}
                    >
                      {pair.patient.patientNum}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-300" style={{ fontSize: numFont }}>—</span>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl border-2 border-gray-100 dark:border-[#2e2e2e] flex flex-col items-center justify-center overflow-hidden min-h-0 px-2 text-center">
                {pair.cubicle ? (
                  <>
                    <span className="text-gray-700 dark:text-[#f5f5f5] font-bold leading-tight" style={{ fontSize: `${Math.min(5, rowVh * 0.32)}vh` }}>
                      {formatCubicleDisplay(pair.cubicle)}
                    </span>
                    {doctorName && (
                      <span className="text-gray-400 leading-tight" style={{ fontSize: subFont }}>
                        Dr. {doctorName}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-300" style={{ fontSize: numFont }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}