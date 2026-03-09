'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Patient = {
  id: number;
  patientNum: string;
  status?: string;
};

const services = [
  { name: 'Consultation', color: 'bg-[#3599CC]' },
  { name: 'OPD Card', color: 'bg-[#4cd137]' },
  { name: 'Refill Prescription', color: 'bg-[#a8f07a]' },
  { name: 'ECG', color: 'bg-[#ff6b81]' },
  { name: 'Warfarin', color: 'bg-[#c084fc]' },
  { name: 'OPD Reschedule', color: 'bg-[#a29bfe]' },
  { name: 'Benzathine', color: 'bg-[#00cec9]' },
  { name: 'OPD Screening', color: 'bg-[#f9ca24]' },
];

export default function TransferPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dragging, setDragging] = useState<Patient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Patient[]>>({});
  const [dragOverService, setDragOverService] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: true });

      if (!error && data) setPatients(data);
    };

    fetchPatients();

    const channel = supabase
      .channel('patients-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchPatients();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDrop = async (serviceName: string) => {
    if (!dragging) return;

    // Adder
    setAssignments(prev => ({
      ...prev,
      [serviceName]: [...(prev[serviceName] ?? []), dragging],
    }));

    // Remover
    setPatients(prev => prev.filter(p => p.id !== dragging.id));

    // Updater
    await supabase
      .from('patients')
      .update({ status: serviceName })
      .eq('id', dragging.id);

    setDragging(null);
    setDragOverService(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#ff0202] to-[#320000] font-sans">

   
      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          </svg>
        </div>

        <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white p-3 rounded-4xl">
          <button className="px-5 py-2 bg-[#3599CC] text-white rounded-full text-sm font-semibold">
            Dashboard
          </button>
          <button className="px-5 py-2 text-gray-600 text-sm font-medium hover:text-[#3599CC] underline">
            History
          </button>
          <button className="px-5 py-2 text-gray-600 text-sm font-medium hover:text-[#3599CC] underline">
            Analytics
          </button>
          <button className="px-5 py-2 text-gray-600 text-sm font-medium hover:text-[#3599CC] underline">
            Reports
          </button>
          <button
          onClick={() => router.push('/')}
          className="px-5 py-2 text-gray-600 text-sm font-medium hover:text-[#3599CC] underline"
        >
          <span>Logout</span>
        </button>
        </div>
        <button className="flex items-center gap-1 bg-white p-3 rounded-4xl hover:bg-[#3599CC]" onClick={() => router.push('/')}>
          <i className='bx bxs-bell text-2xl text-[#000000]'></i>
        </button>
          <button className="flex items-center gap-1 bg-white p-3 rounded-4xl hover:bg-[#3599CC]" onClick={() => router.push('/')}>
            <i className='bx bxs-user-circle text-2xl text-[#000000] '></i>
          </button>
      </div>
    </div>


      <div className="px-10 pb-10 flex gap-6 h-[calc(100vh-90px)]">


        <div className="bg-white rounded-3xl shadow-lg p-6 w-48 flex flex-col gap-3 overflow-y-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
            if (!dragging) return;

            setAssignments(prev => {
            const updated = { ...prev };
            for (const key in updated) {
                updated[key] = updated[key].filter(p => p.id !== dragging.id);
            }
            return updated;
            });

            setPatients(prev => {
            if (prev.find(p => p.id === dragging.id)) return prev;
            return [...prev, dragging].sort((a, b) => a.id - b.id);
            });

            supabase
            .from('patients')
            .update({ status: 'Waiting' })
            .eq('id', dragging.id);

            setDragging(null);
        }}
        >
        <h2 className="text-gray-700 font-semibold text-base mb-2">Patient Queue</h2>
        {patients.length === 0 && (
            <p className="text-gray-300 text-xs">No patients today.</p>
        )}
        {patients.map((p) => (
            <div
            key={p.id}
            draggable
            onDragStart={() => setDragging(p)}
            onDragEnd={() => setDragging(null)}
            className={`px-4 py-2 bg-[#3599CC] text-white rounded-full text-sm font-semibold cursor-grab active:cursor-grabbing select-none transition ${
                dragging?.id === p.id ? 'opacity-50' : 'opacity-100'
            }`}
            >
            {p.patientNum}
            </div>
        ))}
        </div>

        
        <div className="flex-1 grid grid-cols-3 gap-4 content-start">
          {services.map((service) => (
            <div
              key={service.name}
              onDragOver={(e) => { e.preventDefault(); setDragOverService(service.name); }}
              onDragLeave={() => setDragOverService(null)}
              onDrop={() => handleDrop(service.name)}
              className={`${service.color} rounded-3xl p-4 flex flex-col gap-2 min-h-32 transition-all ${
                dragOverService === service.name ? 'scale-105 ring-4 ring-white ring-opacity-70' : ''
              }`}
            >
              <span className="text-white font-semibold text-sm">{service.name}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(assignments[service.name] ?? []).map((p) => (
                <span
                    key={p.id}
                    draggable
                    onDragStart={() => setDragging(p)}
                    onDragEnd={() => setDragging(null)}
                    className="px-2 py-1 bg-white/30 text-white rounded-full text-xs font-medium cursor-grab active:cursor-grabbing select-none"
                >
                    {p.patientNum}
                </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}