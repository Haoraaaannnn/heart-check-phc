'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
};

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const navItems = [
    { icon: 'bx-transfer', label: 'Transfer', path: '/transfer' },
    { icon: 'bxs-dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'bxs-time', label: 'History', path: '/history' },
    { icon: 'bxs-bar-chart-alt-2', label: 'Analytics', path: '/analytics' },
    
  ];

  return (
    <div
      className={`h-screen bg-white border-r border-red-100 shadow-sm flex flex-col transition-all duration-300 ${
        expanded ? 'w-48' : 'w-16'
      }`}
    >

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center py-5 hover:bg-red-50 transition"
      >
        <i className={`bx ${expanded ? 'bx-chevron-left' : 'bx-chevron-right'} text-2xl text-gray-400`}></i>
      </button>


      <div className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => (
          <button
          key={item.label}
          onClick={() => router.push(item.path)}
          className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition w-full ${
           pathname === item.path
            ? 'bg-red-50 text-[#cc3535]'
            : 'hover:bg-red-50 hover:text-[#cc3535] text-gray-500'
           }`}
            >
            <i className={`bx ${item.icon} text-xl flex-shrink-0`}></i>
            {expanded && (
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            )}
          </button>
        ))}
      </div>
            <div className="px-2 pb-4">
        <button
          onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 hover:text-[#cc3535] text-gray-500 transition w-full"
        >
          <i className='bx bx-log-out text-xl flex-shrink-0'></i>
          {expanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default function TransferPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dragging, setDragging] = useState<Patient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Patient[]>>({});
  const [services, setServices] = useState<{ id: number; cubicleNum: string }[]>([]);
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

    const fetchCubicles = async () => {
    const { data, error } = await supabase
      .from('cubicle')
      .select('*')
      .order('id', { ascending: true });
    if (!error && data) setServices(data);
  };

  fetchCubicles();

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
    <div className="flex min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100 font-sans">


      <Sidebar />


      <div className="flex-1 flex flex-col">


        <div className="flex items-center justify-end px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100 shadow-sm">
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
              key={service.cubicleNum}
              onDragOver={(e) => { e.preventDefault(); setDragOverService(service.cubicleNum); }}
              onDragLeave={() => setDragOverService(null)}
              onDrop={() => handleDrop(service.cubicleNum)}
              className={`bg-white border-2 rounded-3xl p-4 flex flex-col gap-2 min-h-70 shadow-sm transition-all duration-150 ${
                dragOverService === service.cubicleNum
                  ? 'border-[#cc3535] bg-red-50 scale-105'
                  : 'border-gray-100 hover:border-red-200'
              }`}
            >
              <span className="text-gray-700 font-semibold text-sm">{service.cubicleNum}</span>
              <div className="flex flex-wrap gap-1">
                {(assignments[service.cubicleNum] ?? []).map((p) => (
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
    </div>
  );
}