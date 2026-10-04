'use client';
import { useState } from 'react';
import { RoomsPanel } from '../components/RoomsPanel';
import { CountersPanel } from '../components/CountersPanel';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { useRequireAuth } from '../hooks/useRequireAuth';

export default function FacilitiesPage() {
  const checking = useRequireAuth();
  useIdleTimeout();
  const [tab, setTab] = useState<'rooms' | 'counters'>('rooms');

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Facilities</h1>
      <p className="text-gray-600 mt-1 mb-6">Manage rooms, cubicles and registration counters.</p>

      <div className="flex gap-2 mb-6">
        {(['rooms', 'counters'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t === 'rooms' ? 'Rooms & Cubicles' : 'Counters'}
          </button>
        ))}
      </div>

      {tab === 'rooms' ? <RoomsPanel /> : <CountersPanel />}
    </div>
  );
}