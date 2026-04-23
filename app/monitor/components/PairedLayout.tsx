'use client';
import { Patient } from '../types';

type PairedLayoutProps = {
  title: string;
  pairedData: { patient: Patient | null; cubicle: string }[];
  formatCubicleDisplay: (cubicleNum: string) => string;
};

export function PairedLayout({ title, pairedData, formatCubicleDisplay }: PairedLayoutProps) {
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
            {pairedData.map((pair, index) => (
              <div key={index} className="grid grid-cols-2 gap-8">
                <div className={`bg-white rounded-2xl p-6 shadow-md border-2 flex items-center justify-center min-h-[120px] ${
                  index === 0 ? 'border-[#cc3535] bg-red-50' : 'border-gray-100'
                }`}>
                  {pair.patient ? (
                    <span className="text-[#cc3535] font-black text-5xl tabular-nums">
                      {pair.patient.patientNum}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-3xl">—</span>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 shadow-md border-2 border-gray-100 flex items-center justify-center min-h-[120px]">
                  {pair.cubicle ? (
                    <span className="text-gray-700 font-bold text-3xl">
                      {formatCubicleDisplay(pair.cubicle)}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-3xl">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}