import { useState } from 'react';
import AnalyticsMetricCards from '@/components/reusables/analyticsMetricCards';
import { AllRecentPatient } from '@/types/Types';
import { PATIENTS_PER_PAGE } from '@/constants/patients';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in queue': case 'waiting': case 'pending': case 'assigned':
      return 'bg-yellow-100 text-yellow-800';
    case 'in service': case 'on progress': case 'consulting': case 'serving':
      return 'bg-blue-100 text-blue-800';
    case 'completed': case 'done': case 'served':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RecentPatientsTable({ patients }: { patients: AllRecentPatient[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(patients.length / PATIENTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PATIENTS_PER_PAGE;
  const paginatedPatients = patients.slice(startIdx, startIdx + PATIENTS_PER_PAGE);

  return (
    <AnalyticsMetricCards>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">All Recent Patients</h2>
          <p className="text-sm text-gray-400 mt-1">Patients from the last 30 days</p>
        </div>
        {patients.length > 0 && (
          <div className="text-xs text-gray-400 font-semibold">
            Showing{' '}
            <span className="text-gray-700 dark:text-gray-300">{startIdx + 1}</span> to{' '}
            <span className="text-gray-700 dark:text-gray-300">
              {Math.min(startIdx + PATIENTS_PER_PAGE, patients.length)}
            </span>{' '}
            of <span className="text-gray-700 dark:text-gray-300">{patients.length}</span> patients
          </div>
        )}
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent patients found.</p>
          <p className="text-sm text-gray-400 mt-2">Patient data will appear here as registrations occur.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Patient #', 'Service', 'Status', 'Time', 'Wait Time'].map((h) => (
                    <th key={h} className="pb-4 px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                    <td className="py-4 px-4">
                      <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-extrabold px-3 py-1 rounded-lg text-sm">
                        {patient.patientNum || '---'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{patient.service}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">{patient.createdAt}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {patient.waitTime !== undefined ? `${patient.waitTime}m` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                    currentPage === page
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </AnalyticsMetricCards>
  );
}