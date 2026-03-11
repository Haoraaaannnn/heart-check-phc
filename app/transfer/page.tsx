'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
};

const services = [
  { name: 'Cubicle 1' },
  { name: 'Cubicle 2' },
  { name: 'Cubicle 3' },
  { name: 'Cubicle 4' },
  { name: 'Cubicle 5' },
  { name: 'Cubicle 6' },
  { name: 'Cubicle 7' },
  { name: 'Cubicle 8' },
];

export default function TransferPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dragging, setDragging] = useState<Patient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Patient[]>>({});
  const [dragOverService, setDragOverService] = useState<string | null>(null);

  useEffect(() => {
    
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace('/login');
      return;
    }
  };

  checkSession();

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

      if (!error && data) {

        const queue = data.filter((p: Patient) => !p.cubicleNum);
        const assigned = data.filter((p: Patient) => p.cubicleNum);

        setPatients(queue);

        const rebuilt: Record<string, Patient[]> = {};
        for (const p of assigned) {
          if (!p.cubicleNum) continue;
          if (!rebuilt[p.cubicleNum]) rebuilt[p.cubicleNum] = [];
          rebuilt[p.cubicleNum].push(p);
        }
        setAssignments(rebuilt);
      }
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

    setAssignments(prev => {
      const updated = { ...prev };
      for (const key in updated) {
        updated[key] = updated[key].filter(p => p.id !== dragging.id);
      }
      return {
        ...updated,
        [serviceName]: [...(updated[serviceName] ?? []), dragging],
      };
    });

    setPatients(prev => prev.filter(p => p.id !== dragging.id));

    await supabase
      .from('patients')
      .update({ cubicleNum: serviceName, status: 'On Progress' })
      .eq('id', dragging.id);

    setDragging(null);
    setDragOverService(null);
  };

  return (
<div className="min-h-screen w-full bg-gradient-to-br from-white via-red-50 to-red-100 font-sans">

      <div className="flex items-center gap-2 justify-end px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100 shadow-sm">

        <div className="flex items-center gap-1 bg-gray-100 px-2 py-2 rounded-full">
          <button className="px-5 py-2 bg-[#cc3535] text-white rounded-full text-sm font-semibold shadow-sm">Transfer</button>
          <button className="px-5 py-2 text-gray-500 text-sm font-medium hover:text-[#cc3535] transition" onClick={() => router.push('/dashboard')}>Dashboard</button>
          <button className="px-5 py-2 text-gray-500 text-sm font-medium hover:text-[#cc3535] transition">History</button>
          <button className="px-5 py-2 text-gray-500 text-sm font-medium hover:text-[#cc3535] transition">Analytics</button>
          <button className="px-5 py-2 text-gray-500 text-sm font-medium hover:text-[#cc3535] transition" onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}>Logout</button>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition">
            <i className='bx bxs-bell text-lg text-gray-500'></i>
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition">
            <i className='bx bxs-user-circle text-lg text-gray-500'></i>
          </button>
        </div>
      </div>

      <div className="px-8 py-6 flex gap-5 h-[calc(100vh-73px)]">

        <div
          className="bg-white border-2 border-gray-200 rounded-3xl p-5 w-44 h-143 flex flex-col gap-2 overflow-y-auto shadow-sm"
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
            supabase.from('patients').update({ cubicleNum: null, status: 'Waiting' }).eq('id', dragging.id);
            setDragging(null);
          }}
        >
          <h2 className="text-gray-400 font-semibold text-xs mb-1 tracking-widest uppercase">Queue</h2>
          {patients.length === 0 && (
            <p className="text-gray-300 text-xs mt-2">No patients today.</p>
          )}
          {patients.map((p) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setDragging(p)}
              onDragEnd={() => setDragging(null)}
              className={`px-3 py-2 bg-[#cc3535] text-white rounded-2xl text-sm font-semibold cursor-grab active:cursor-grabbing select-none shadow-sm transition-opacity ${
                dragging?.id === p.id ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {p.patientNum}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-4 gap-3 content-start">
          {services.map((service) => (
            <div
              key={service.name}
              onDragOver={(e) => { e.preventDefault(); setDragOverService(service.name); }}
              onDragLeave={() => setDragOverService(null)}
              onDrop={() => handleDrop(service.name)}
              className={`bg-white border-2 rounded-3xl p-4 flex flex-col gap-2 min-h-70 shadow-sm transition-all duration-150 ${
                dragOverService === service.name
                  ? 'border-[#cc3535] bg-red-50 scale-105'
                  : 'border-gray-100 hover:border-red-200'
              }`}
            >
              <span className="text-gray-700 font-semibold text-sm">{service.name}</span>
              <div className="flex flex-wrap gap-1">
                {(assignments[service.name] ?? []).map((p) => (
                  <span
                    key={p.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragging(p); }}
                    onDragEnd={() => setDragging(null)}
                    className="px-2 py-1 bg-[#cc3535] text-white rounded-full text-xs font-medium cursor-grab active:cursor-grabbing select-none hover:bg-red-700 transition"
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