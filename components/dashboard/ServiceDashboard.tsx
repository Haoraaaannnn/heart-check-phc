'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// --- PROPS DEFINITION ---
interface ServiceDashboardProps {
  title: string;
  serviceFilter: string;
  icon: string;
}

interface QueuedPatient {
  id: number;
  ticket: string;
  joinedAtMs: number;
}

interface ServiceStats {
  waiting: number;
  serving: number;
  served: number;
  avgWaitMins: number | null;
  longestWaitMins: number;
  activeRooms: string[];
  waitingList: QueuedPatient[];
}

export function ServiceDashboard({ title, serviceFilter, icon }: ServiceDashboardProps) {
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  const [stats, setStats] = useState<ServiceStats>({
    waiting: 0,
    serving: 0,
    served: 0,
    avgWaitMins: null,
    longestWaitMins: 0,
    activeRooms: [],
    waitingList: [],
  });

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace('/login');
    };
    checkSession();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const fetchServiceData = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      
      // Uses the prop to fetch specific service
      const { data, error } = await supabase
        .from('patients')
        .select('id, status, created_at, consult_start, patientNum, cubicleNum')
        .ilike('service', serviceFilter)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (!error && data) {
        let waitingCount = 0;
        let servingCount = 0;
        let servedCount = 0;
        let totalWaitMs = 0;
        
        const rooms = new Set<string>();
        const waitList: QueuedPatient[] = [];

        data.forEach((patient) => {
          const currentStatus = patient.status ? patient.status.toLowerCase().trim() : '';
          const joinedAtMs = new Date(patient.created_at).getTime();

          if (['pending', 'waiting'].includes(currentStatus)) {
            waitingCount++;
            if (patient.patientNum) {
              waitList.push({ id: patient.id, ticket: patient.patientNum, joinedAtMs });
            }
          } 
          else if (['on progress', 'serving', 'consulting'].includes(currentStatus)) {
            servingCount++;
            if (patient.cubicleNum) {
              rooms.add(patient.cubicleNum);
            }
          } 
          else if (['completed', 'done', 'served'].includes(currentStatus)) {
            servedCount++;
            if (patient.consult_start) {
              const servedAt = new Date(patient.consult_start).getTime();
              totalWaitMs += (servedAt - joinedAtMs);
            }
          }
        });

        let avgMins = null;
        if (servedCount > 0 && totalWaitMs > 0) {
          avgMins = Math.round(totalWaitMs / servedCount / 60000);
        }

        waitList.sort((a, b) => a.joinedAtMs - b.joinedAtMs);

        let longestMins = 0;
        if (waitList.length > 0) {
           longestMins = Math.floor((new Date().getTime() - waitList[0].joinedAtMs) / 60000);
        }

        setStats({
          waiting: waitingCount,
          serving: servingCount,
          served: servedCount,
          avgWaitMins: avgMins,
          longestWaitMins: longestMins,
          activeRooms: Array.from(rooms),
          waitingList: waitList,
        });
      }
    };

    fetchServiceData();

    const channel = supabase
      .channel(`service-${serviceFilter}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchServiceData(); 
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(timer);
    };
  }, [router, serviceFilter]);

  const getLiveWaitMins = (joinedAtMs: number) => {
    if (!currentTime) return 0;
    const diff = Math.floor((currentTime.getTime() - joinedAtMs) / 60000);
    return diff > 0 ? diff : 0;
  };

  if (!isMounted) return null;

  const isBottleneck = stats.longestWaitMins > 60;
  const isServiceActive = stats.serving > 0;

  return (
    <div className="px-8 py-6 flex flex-col gap-8 min-h-screen">
      
      {/* 1. Header uses Props */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-red-50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-4xl">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">{title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {isServiceActive ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-extrabold uppercase rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-extrabold uppercase rounded-full flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Standby
                </span>
              )}
              {stats.activeRooms.length > 0 && (
                <span className="text-sm font-semibold text-gray-500">
                  Rooms: <span className="text-gray-800">{stats.activeRooms.join(', ')}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Big Core Metrics */}
      <div className="flex flex-wrap gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-6 flex flex-col justify-between h-36 w-64">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Waiting</span>
          <span className="text-orange-500 text-5xl font-extrabold self-end">{stats.waiting}</span>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-6 flex flex-col justify-between h-36 w-64">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Currently Serving</span>
          <span className="text-green-600 text-5xl font-extrabold self-end">{stats.serving}</span>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-6 flex flex-col justify-between h-36 w-64">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Done Today</span>
          <span className="text-gray-800 text-5xl font-extrabold self-end">{stats.served}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Detailed Up Next List */}
        <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-8 lg:col-span-2">
          <h2 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
            🎟️ Up Next Queue
          </h2>
          
          <div className="flex flex-col gap-3">
            {stats.waitingList.length > 0 ? (
              stats.waitingList.map((patient, idx) => {
                const liveMins = getLiveWaitMins(patient.joinedAtMs);
                const isOverdue = liveMins > 60;

                return (
                  <div 
                    key={patient.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-extrabold ${idx === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {idx + 1}. {patient.ticket}
                      </span>
                      {idx === 0 && <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase">Next</span>}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-gray-400 uppercase mb-1">Waiting For</span>
                      <span className={`text-lg font-extrabold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                        {liveMins} mins
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-gray-400 italic">No patients waiting in this queue.</div>
            )}
          </div>
        </div>

        {/* 4. Service Time Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Time Stats</h3>
            
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-gray-500 font-semibold block mb-1">⏱️ Average Wait Time</span>
                <span className="text-3xl font-extrabold text-gray-800">
                  {stats.avgWaitMins !== null ? `${stats.avgWaitMins} min` : '--'}
                </span>
              </div>

              <hr className="border-gray-100" />

              <div>
                <span className="text-gray-500 font-semibold block mb-1">⚠️ Longest Wait (Bottleneck)</span>
                <span className={`text-3xl font-extrabold ${isBottleneck ? 'text-red-600' : 'text-gray-800'}`}>
                  {stats.longestWaitMins > 0 ? `${stats.longestWaitMins} min` : '--'}
                </span>
                {isBottleneck && (
                  <p className="text-xs text-red-500 font-bold mt-2">Alert: Patient waiting over 1 hour!</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}