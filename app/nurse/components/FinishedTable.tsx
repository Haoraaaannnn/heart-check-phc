'use client';
import { Patient } from '@/types/Types';

type FinishedTableProps = {
  patients: Patient[];
};

export function FinishedTable({ patients }: FinishedTableProps) {
  return (
    <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-sm p-5">
      <h2 className="text-gray-400 font-semibold text-xs mb-3 tracking-widest uppercase">Finished Today ({patients.length})</h2>
      {patients.length === 0 ? (
        <p className="text-gray-300 text-xs">No finished patients yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Queue No.</th>
                <th className="text-left pb-2 font-medium">Service</th>
                <th className="text-left pb-2 font-medium">Cubicle</th>
                <th className="text-left pb-2 font-medium">Time Finished</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-2 font-semibold text-[#cc3535]">{p.patientNum}</td>
                  <td className="py-2 text-gray-600">{p.service}</td>
                  <td className="py-2 text-gray-600">{p.cubicleNum || '-'}</td>
                  <td className="py-2 text-gray-400">{p.consult_end ? new Date(p.consult_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}