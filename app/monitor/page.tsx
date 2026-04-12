'use client';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine'
];

export default function MonitorIndexPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-12">
      <h1 className="text-3xl font-bold text-gray-700">Select Monitor</h1>
      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => router.push(`/monitor/${encodeURIComponent(cat)}`)}
            className="bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-3xl p-6 text-gray-700 font-semibold text-sm shadow-sm transition text-left"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}