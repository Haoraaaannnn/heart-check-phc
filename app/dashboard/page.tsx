'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { supabase } from '@/lib/supabase';
  
Chart.register(...registerables);

//calendar
function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));


  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];


  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7).concat(Array(7).fill(null)).slice(0, 7));
  }

  const isToday = (d: number | null) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-gray-400 hover:text-[#3599CC] text-lg font-bold">&#8249;</button>
        <span className="text-sm font-semibold text-gray-700">{monthName} {year}</span>
        <button onClick={nextMonth} className="text-gray-400 hover:text-[#3599CC] text-lg font-bold">&#8250;</button>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {days.map(d => (
          <span key={d} className="text-xs text-gray-400 font-medium">{d}</span>
        ))}
      </div>
      {weeks.map((week, i) => (
        <div key={i} className="grid grid-cols-7 text-center">
          {week.map((d, j) => (
            <span
              key={j}
              className={`text-xs py-1 rounded-full cursor-pointer
                ${isToday(d) ? 'bg-[#3599CC] text-white font-bold' : 'text-gray-600 hover:text-[#3599CC]'}
                ${!d ? 'invisible' : ''}
              `}
            >
              {d}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {

  const router = useRouter();
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace('/login');
      return;
    }
  };

  checkSession();

  const fetchTodayPatients = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); //binabago everyday
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (!error) setTodayCount(count);
  };

  fetchTodayPatients();

  //kumukuha sa db
  const channel = supabase
    .channel('patients-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'patients' },
      () => {
        fetchTodayPatients(); //pampa auto bilang
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red-50 to-red-100 font-sans">

    <div className="flex items-center justify-between px-6 py-4">

        <div className="flex items-center gap-2">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="10" fill="white" fillOpacity="0.3"/>
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
          <button className="px-5 py-2 text-gray-600 text-sm font-medium hover:text-[#3599CC] underline" onClick={() => router.push('/transfer')}>
            Transfer
          </button>
          <button className="px-5 py-2 text-gray-600 text-sm font-medium hover:text-[#cc3535] underline" onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}>
          Logout
        </button>
        </div>
        <button className="flex items-center gap-1 bg-white p-3 rounded-4xl hover:bg-[#3599CC]">
          <i className='bx bxs-bell text-2xl text-[#000000]'></i>
        </button>
          <button className="flex items-center gap-1 bg-white p-3 rounded-4xl hover:bg-[#3599CC]">
            <i className='bx bxs-user-circle text-2xl text-[#000000] '></i>
          </button>
      </div>
    </div>

      <div className="px-6 pb-6 flex gap-5">

        <div className="flex flex-col gap-5 flex-1">

          <div className="flex gap-5">
            <div className="rounded-3xl shadow-lg p-6 w-64 h-36 flex flex-col justify-between bg-gradient-to-br from-[#2687e7] to-[#3599CC]">
              <span className="text-white text-sm font-medium">Today Patients</span>
              <span className="text-white text-5xl font-bold self-end">{todayCount ?? '...'}</span>
            </div>
            <div className="rounded-3xl shadow-lg p-6 w-64 h-36 flex flex-col justify-between bg-gradient-to-br from-[#a8f07a] to-[#4cd137]">
              <span className="text-white text-sm font-medium">Average Waiting Time</span>
              <span className="text-white text-4xl font-bold self-end">13 <span className="text-2xl">minutes</span></span>
            </div>
          </div>
        </div>


      <div className="flex flex-col gap-5 w-64">
      <div className="bg-white rounded-3xl shadow-lg p-5">
            <MiniCalendar />
          </div>
        </div>

        </div>
    </div>
  );
}
