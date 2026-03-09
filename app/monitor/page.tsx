'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { supabase } from '@/lib/supabase';
  
Chart.register(...registerables);

export default function DashboardPage() {
  const router = useRouter();
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchTodayPatients = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#ff6d6d] to-[#f07c62] font-sans">


      <div className="flex items-center justify-center px-6 py-4">
        <div className="flex items-center gap-1 bg-white p-3 rounded-4xl">
          <div className="px-5 py-2 text-black rounded-full text-sm font-semibold">
            Consultation
          </div>
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
      </div>

    </div>
  );
}