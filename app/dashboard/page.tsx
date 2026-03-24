'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    
    { icon: 'bxs-dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'bxs-time', label: 'History', path: '/history' },
    { icon: 'bxs-bar-chart-alt-2', label: 'Analytics', path: '/analytics' },
    { icon: 'bx-transfer', label: 'Transfer', path: '/transfer' },
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

export default function DashboardPage() {
  const router = useRouter();
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace('/login');
    };
    checkSession();

    const fetchTodayPatients = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const { count, error } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);
      if (!error) setTodayCount(count);
    };

    fetchTodayPatients();

    const channel = supabase
      .channel('patients-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patients' }, () => {
        fetchTodayPatients();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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


        <div className="px-8 py-6 flex flex-col gap-5">


          <div className="flex gap-5">
            <div className="rounded-3xl shadow-sm border-2 border-red-100 p-6 w-64 h-36 flex flex-col justify-between bg-white">
              <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Today Patients</span>
              <span className="text-[#cc3535] text-5xl font-bold self-end">{todayCount ?? '...'}</span>
            </div>
            <div className="rounded-3xl shadow-sm border-2 border-red-100 p-6 w-64 h-36 flex flex-col justify-between bg-white">
              <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Average Waiting Time</span>
              <span className="text-[#cc3535] text-4xl font-bold self-end">13 <span className="text-2xl">min</span></span>
            </div>
          </div>


          <div className="bg-white rounded-3xl shadow-sm border-2 border-red-100 p-6 h-72 flex items-center justify-center text-gray-300 text-sm">
            Chart sana
          </div>

        </div>
      </div>
    </div>
  );
}