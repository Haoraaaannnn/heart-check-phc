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
  service?: string;
};

type Cubicle = {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
};

const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine'
];

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
    <div className={`h-screen bg-white border-r border-red-100 shadow-sm flex flex-col transition-all duration-300 ${expanded ? 'w-48' : 'w-16'}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-center py-5 hover:bg-red-50 transition">
        <i className={`bx ${expanded ? 'bx-chevron-left' : 'bx-chevron-right'} text-2xl text-gray-400`}></i>
      </button>
      <div className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => router.push(item.path)}
            className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition w-full ${
              pathname === item.path ? 'bg-red-50 text-[#cc3535]' : 'hover:bg-red-50 hover:text-[#cc3535] text-gray-500'
            }`}
          >
            <i className={`bx ${item.icon} text-xl flex-shrink-0`}></i>
            {expanded && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </div>
      <div className="px-2 pb-4">
        <button
          onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 hover:text-[#cc3535] text-gray-500 transition w-full"
        >
          <i className="bx bx-log-out text-xl flex-shrink-0"></i>
          {expanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default function TransferPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [categoryQueue, setCategoryQueue] = useState<Record<string, Patient[]>>({});
  const [dragging, setDragging] = useState<Patient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Patient[]>>({});
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [dragOverService, setDragOverService] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace('/login'); return; }
    };
    checkSession();

    const fetchPatients = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: true });

      if (!error && data) {
        const queue = data.filter((p: Patient) => !p.cubicleNum);
        const assigned = data.filter((p: Patient) => p.cubicleNum);

        setPatients(queue);

        const byCat: Record<string, Patient[]> = {};
        for (const p of queue) {
          const cat = p.service ?? 'Unknown';
          if (!byCat[cat]) byCat[cat] = [];
          byCat[cat].push(p);
        }
        setCategoryQueue(byCat);

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
      if (!error && data) setCubicles(data);
    };

    fetchCubicles();

    const channel = supabase
      .channel('patients-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchPatients())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const handleDrop = async (cubicleNum: string) => {
  if (!dragging) return;

  const targetCubicle = cubicles.find(c => c.cubicleNum === cubicleNum);
  const newService = targetCubicle?.category ?? dragging.service;

  setAssignments(prev => {
    const updated = { ...prev };
    for (const key in updated) updated[key] = updated[key].filter(p => p.id !== dragging.id);
    return { ...updated, [cubicleNum]: [...(updated[cubicleNum] ?? []), dragging] };
  });

  setPatients(prev => prev.filter(p => p.id !== dragging.id));

  setCategoryQueue(prev => {
    const updated = { ...prev };
    for (const key in updated) updated[key] = updated[key].filter(p => p.id !== dragging.id);
    return updated;
  });

  await supabase
    .from('patients')
    .update({ 
      cubicleNum, 
      status: 'On Progress',
      service: newService,
    })
    .eq('id', dragging.id);

  setDragging(null);
  setDragOverService(null);
};

  const rooms = selectedCategory
    ? [...new Set(cubicles.filter(c => c.category === selectedCategory).map(c => c.room))].sort()
    : [];

  const visibleCubicles = selectedCategory && selectedRoom
    ? cubicles.filter(c => c.category === selectedCategory && c.room === selectedRoom)
    : [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-end px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100 shadow-sm">
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition">
              <i className="bx bxs-bell text-lg text-gray-500"></i>
            </button>
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition">
              <i className="bx bxs-user-circle text-lg text-gray-500"></i>
            </button>
          </div>
        </div>

        <div className="px-8 py-6 flex gap-5 h-[calc(100vh-73px)]">

          <div
            className="bg-white border-2 border-gray-200 rounded-3xl p-5 w-44 flex flex-col gap-2 overflow-y-auto shadow-sm flex-shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!dragging) return;
              setAssignments(prev => {
                const updated = { ...prev };
                for (const key in updated) updated[key] = updated[key].filter(p => p.id !== dragging.id);
                return updated;
              });
              setPatients(prev => {
                if (prev.find(p => p.id === dragging.id)) return prev;
                return [...prev, dragging].sort((a, b) => a.id - b.id);
              });
              setCategoryQueue(prev => {
                const updated = { ...prev };
                for (const key in updated) updated[key] = updated[key].filter(p => p.id !== dragging.id);
                const cat = dragging.service ?? 'Unknown';
                return { ...updated, [cat]: [...(updated[cat] ?? []), dragging] };
              });
              supabase
                .from('patients')
                .update({ cubicleNum: null, status: 'Waiting' })
                .eq('id', dragging.id);
              setDragging(null);
            }}
          >
          <h2 className="text-gray-400 font-semibold text-xs mb-1 tracking-widest uppercase">
            All Queue
          </h2>
          {patients.length === 0 ? (
            <p className="text-gray-300 text-xs mt-2">No patients waiting.</p>
          ) : (
            patients.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragging(p)}
                onDragEnd={() => setDragging(null)}
                className={`px-3 py-2 bg-[#cc3535] text-white rounded-2xl text-sm font-semibold cursor-grab active:cursor-grabbing select-none shadow-sm transition-opacity ${
                  dragging?.id === p.id ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <span className="block text-xs font-normal opacity-70">{p.service}</span>
                {p.patientNum}
              </div>
            ))
          )}
          </div>


          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button
                onClick={() => { setSelectedCategory(null); setSelectedRoom(null); }}
                className={`hover:text-[#cc3535] transition ${!selectedCategory ? 'text-[#cc3535] font-semibold' : ''}`}
              >
                Categories
              </button>
              {selectedCategory && (
                <>
                  <span>/</span>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className={`hover:text-[#cc3535] transition ${selectedCategory && !selectedRoom ? 'text-[#cc3535] font-semibold' : ''}`}
                  >
                    {selectedCategory}
                  </button>
                </>
              )}
              {selectedRoom && (
                <>
                  <span>/</span>
                  <span className="text-[#cc3535] font-semibold">Room {selectedRoom}</span>
                </>
              )}
            </div>

            {!selectedCategory && (
              <div className="grid grid-cols-4 gap-3">
                {CATEGORIES.map(cat => {
                  const waiting = categoryQueue[cat]?.length ?? 0;
                  const totalAssigned = cubicles
                    .filter(c => c.category === cat)
                    .reduce((sum, c) => sum + (assignments[c.cubicleNum]?.length ?? 0), 0);
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left"
                    >
                      <span className="text-gray-700 font-semibold text-sm">{cat}</span>
                      {waiting > 0 && (
                        <span className="text-xs text-orange-400 font-medium">{waiting} waiting</span>
                      )}
                      {totalAssigned > 0 && (
                        <span className="text-xs text-[#cc3535] font-medium">{totalAssigned} in cubicle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}


            {selectedCategory && !selectedRoom && (
              <div className="flex flex-col gap-4">

                {(categoryQueue[selectedCategory]?.length ?? 0) > 0 && (
                  <div className="bg-white border-2 border-orange-100 rounded-3xl p-4 flex flex-wrap gap-2">
                    <span className="w-full text-xs text-gray-400 font-semibold tracking-widest uppercase mb-1">Waiting</span>
                    {categoryQueue[selectedCategory].map(p => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragging(p)}
                        onDragEnd={() => setDragging(null)}
                        className={`px-3 py-2 bg-orange-400 text-white rounded-2xl text-sm font-semibold cursor-grab select-none shadow-sm transition-opacity ${
                          dragging?.id === p.id ? 'opacity-40' : 'opacity-100'
                        }`}
                      >
                        {p.patientNum}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {rooms.map(room => {
                    const roomCubicles = cubicles.filter(c => c.category === selectedCategory && c.room === room);
                    const totalAssigned = roomCubicles.reduce((sum, c) => sum + (assignments[c.cubicleNum]?.length ?? 0), 0);
                    return (
                      <button
                        key={room}
                        onClick={() => setSelectedRoom(room)}
                        className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left"
                      >
                        <span className="text-gray-700 font-semibold text-sm">Room {room}</span>
                        {totalAssigned > 0 && (
                          <span className="text-xs text-[#cc3535] font-medium">{totalAssigned} in cubicle</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedCategory && selectedRoom && (
              <div className="grid grid-cols-5 gap-3">
                {visibleCubicles.map(c => (
                  <div
                    key={c.id}
                    onDragOver={(e) => { e.preventDefault(); setDragOverService(c.cubicleNum); }}
                    onDragLeave={() => setDragOverService(null)}
                    onDrop={() => handleDrop(c.cubicleNum)}
                    className={`bg-white border-2 rounded-3xl p-4 flex flex-col gap-2 min-h-36 shadow-sm transition-all duration-150 ${
                      dragOverService === c.cubicleNum ? 'border-[#cc3535] bg-red-50 scale-105' : 'border-gray-100 hover:border-red-200'
                    }`}
                  >
                    <span className="text-gray-700 font-semibold text-xs">{c.cubicleNum}</span>
                    <div className="flex flex-wrap gap-1">
                      {(assignments[c.cubicleNum] ?? []).map(p => (
                        <span
                          key={p.id}
                          draggable
                          onDragStart={(e) => { e.stopPropagation(); setDragging(p); }}
                          onDragEnd={() => setDragging(null)}
                          className="px-2 py-1 bg-[#cc3535] text-white rounded-full text-xs font-medium cursor-grab select-none hover:bg-red-700 transition"
                        >
                          {p.patientNum}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}