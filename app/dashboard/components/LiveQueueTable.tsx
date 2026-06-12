import { PatientRecord } from '@/app/dashboard/hooks/useOverviewData';
import { getPatientWaitTime } from '@/utils/waitTime';
import StatusBadge from './StatusBadge';

interface LiveQueueTableProps {
  patients: PatientRecord[];
  currentTime: Date;
  isMounted: boolean;
}

export default function LiveQueueTable({ patients, currentTime, isMounted }: LiveQueueTableProps) {
  return (
    <div className="bg-white/35 rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] border border-white/40 p-8 backdrop-blur-xl lg:col-span-2
      dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2 dark:text-gray-200">
            Live Queue
          </h2>
          <p className="text-sm text-gray-400 mt-1">Real-time patient ticket status</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            {['Ticket', 'Service', 'Wait', 'Status'].map((h) => (
              <th key={h} className="pb-4 text-xs font-bold text-gray-400 tracking-wider uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isMounted && patients.slice(0, 6).map((patient) => (
            <tr key={patient.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
              <td className="py-4">
                <span className="bg-red-50 text-red-700 font-extrabold px-3 py-1 rounded-lg">
                  {patient.patientNum || '---'}
                </span>
              </td>
              <td className="py-4 text-sm font-semibold text-gray-500">
                {patient.service || 'General'}
              </td>
              <td className="py-4 text-sm font-semibold text-gray-500">
                {getPatientWaitTime(patient, currentTime)} min
              </td>
              <td className="py-4">
                <StatusBadge status={patient.status || 'Pending'} />
              </td>
            </tr>
          ))}
          {isMounted && patients.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                No patients in the queue today.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}