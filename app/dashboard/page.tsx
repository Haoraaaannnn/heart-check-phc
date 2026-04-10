'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  todayCount: number;
  onQueue: number;
  served: number;
  avgWaitMins: number | null;
}

interface PatientRecord {
  id: number;
  patientNum: string;
  service: string;
  status: string;
  created_at: string;
  consult_start: string | null;
  consult_end: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // 1. Safe Client-Side Time Tracking
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    todayCount: 0,
    onQueue: 0,
    served: 0,
    avgWaitMins: null,
  });

  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace('/login');
    };
    checkSession();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const fetchDashboardStats = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, status, created_at, consult_start, consult_end, patientNum, service')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (!error && data) {
        let queueCount = 0;
        let servedCount = 0;
        let totalWaitTimeMs = 0;
        const departments: Record<string, number> = {};

        data.forEach((patient) => {
          const currentStatus = patient.status ? patient.status.toLowerCase().trim() : '';
          const serviceName = patient.service || 'General';

          if (['pending', 'waiting', 'on progress'].includes(currentStatus)) {
            queueCount++;
            departments[serviceName] = (departments[serviceName] || 0) + 1;
          }
          
          if (['completed', 'done', 'served'].includes(currentStatus)) {
            servedCount++;
            
            if (patient.consult_start) {
              const joinedAt = new Date(patient.created_at).getTime();
              const servedAt = new Date(patient.consult_start).getTime();
              totalWaitTimeMs += (servedAt - joinedAt);
            }
          }
        });

        let avgMins = null;
        if (servedCount > 0 && totalWaitTimeMs > 0) {
          avgMins = Math.round(totalWaitTimeMs / servedCount / 60000);
        }

        setStats({
          todayCount: data.length,
          onQueue: queueCount,
          served: servedCount,
          avgWaitMins: avgMins,
        });
        
        setPatientsList(data as PatientRecord[]);
        setDeptStats(departments);
      }
    };

    fetchDashboardStats();

    const channel = supabase
      .channel('patients-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'patients' }, 
        () => {
          fetchDashboardStats(); 
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(timer);
    };
  }, [router]);

  // UI Helpers
  const getLiveWaitMinutes = (createdAt: string) => {
    // Return a safe placeholder during SSR to prevent hydration errors
    if (!isMounted || !currentTime) return '--'; 
    const joined = new Date(createdAt).getTime();
    const diffMins = Math.floor((currentTime.getTime() - joined) / 60000);
    return diffMins > 0 ? diffMins : 0;
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase().trim();
    if (['on progress', 'serving', 'consulting'].includes(s)) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-max"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Serving</span>;
    }
    if (['pending', 'waiting'].includes(s)) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full flex items-center gap-1 w-max"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> Waiting</span>;
    }
    if (['completed', 'done', 'served'].includes(s)) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full flex items-center gap-1 w-max">✓ Done</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">{status}</span>;
  };

  const servedPercentage = stats.todayCount > 0 ? Math.round((stats.served / stats.todayCount) * 100) : 0;

  // We DO NOT return null here anymore! We render the shell safely.
  return (
    <div className="px-8 py-6 flex flex-col gap-6 min-h-screen">

      <div className="flex gap-5 flex-wrap">
        <div className="rounded-3xl shadow-sm border border-red-50 p-6 w-64 h-36 flex flex-col justify-between bg-white">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Today Patients</span>
          <span className="text-[#cc3535] text-5xl font-extrabold self-end">
            {isMounted ? stats.todayCount : '--'}
          </span>
        </div>

        <div className="rounded-3xl shadow-sm border border-red-50 p-6 w-64 h-36 flex flex-col justify-between bg-white">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">On Queue</span>
          <span className="text-orange-500 text-5xl font-extrabold self-end">
            {isMounted ? stats.onQueue : '--'}
          </span>
        </div>

        <div className="rounded-3xl shadow-sm border border-red-50 p-6 w-64 h-36 flex flex-col justify-between bg-white">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Served</span>
          <span className="text-green-500 text-5xl font-extrabold self-end">
            {isMounted ? stats.served : '--'}
          </span>
        </div>

        <div className="rounded-3xl shadow-sm border border-red-50 p-6 w-64 h-36 flex flex-col justify-between bg-white">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Avg Waiting Time</span>
          <span className="text-[#cc3535] text-4xl font-extrabold self-end">
            {isMounted && stats.avgWaitMins !== null ? stats.avgWaitMins : '--'} <span className="text-2xl font-bold">min</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-8 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                Live Queue
              </h2>
              <p className="text-sm text-gray-400 mt-1">Real-time patient ticket status</p>
            </div>
            <button className="text-red-600 text-sm font-bold bg-red-50 px-4 py-2 rounded-full hover:bg-red-100 transition">
              View All →
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Ticket</th>
                <th className="pb-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Service</th>
                <th className="pb-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Wait</th>
                <th className="pb-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {isMounted && patientsList.slice(0, 6).map((patient) => (
                <tr key={patient.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                  <td className="py-4">
                    <span className="bg-red-50 text-red-700 font-extrabold px-3 py-1 rounded-lg">
                      {patient.patientNum || '---'}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-semibold text-gray-500">
                    {patient.service || 'General'}
                  </td>
                  <td className="py-4 text-sm font-semibold text-gray-500">
                    {['completed', 'done', 'served'].includes((patient.status || '').toLowerCase()) 
                      ? '--' 
                      : `${getLiveWaitMinutes(patient.created_at)} min`}
                  </td>
                  <td className="py-4">
                    {renderStatusBadge(patient.status || 'Pending')}
                  </td>
                </tr>
              ))}
              {isMounted && patientsList.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No patients in the queue today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-8 flex flex-col gap-8">
          
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2 mb-1">
              By Service
            </h2>
            <p className="text-sm text-gray-400 mb-6">Patients in queue right now</p>

            <div className="flex flex-col gap-5">
              {isMounted && Object.keys(deptStats).length > 0 ? Object.entries(deptStats).map(([dept, count], idx) => {
                const colors = ['bg-rose-500', 'bg-teal-500', 'bg-orange-400', 'bg-purple-500', 'bg-blue-400'];
                const colorClass = colors[idx % colors.length];
                const barWidth = `${Math.min((count / Math.max(stats.onQueue, 1)) * 100, 100)}%`;

                return (
                  <div key={dept} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                        <span className="text-sm font-bold text-gray-800">{dept}</span>
                      </div>
                      <div className="text-xs text-gray-400 ml-4">{count} waiting</div>
                    </div>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: barWidth }}></div>
                    </div>
                    <div className="text-lg font-extrabold text-gray-800 w-6 text-right">{count}</div>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-400 italic">No patients currently waiting.</p>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-4">Ticket Status Breakdown</h3>
            <div className="flex items-center gap-6">
              
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `conic-gradient(#10b981 ${isMounted ? servedPercentage : 0}%, #f97316 ${isMounted ? servedPercentage : 0}% 100%)`
                }}
              >
                <div className="w-14 h-14 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-gray-800">{isMounted ? servedPercentage : 0}%</span>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Served</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-gray-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Served
                  </span>
                  <span className="font-bold text-green-600">{isMounted ? stats.served : '--'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-gray-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Waiting
                  </span>
                  <span className="font-bold text-orange-500">{isMounted ? stats.onQueue : '--'}</span>
                </div>
              </div>
              
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}