'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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

  // New state to hold our hourly trend data
  const [hourlyTrend, setHourlyTrend] = useState<{ time: string; patients: number }[]>([]);

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
        
        // Setup hourly buckets for the trend chart (e.g., 7 AM to 5 PM)
        const hourCounts: Record<string, number> = {};
        for (let i = 7; i <= 17; i++) {
          hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
        }

        data.forEach((patient) => {
          const currentStatus = patient.status ? patient.status.toLowerCase().trim() : '';
          const joinedAtMs = new Date(patient.created_at).getTime();

          // Tally metrics
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

          // Group by hour for the trend chart
          const patientHour = new Date(patient.created_at).getHours();
          const hourLabel = `${patientHour.toString().padStart(2, '0')}:00`;
          if (hourCounts[hourLabel] !== undefined) {
            hourCounts[hourLabel]++;
          } else {
            hourCounts[hourLabel] = 1; 
          }
        });

        // Calculate Averages
        let avgMins = null;
        if (servedCount > 0 && totalWaitMs > 0) {
          avgMins = Math.round(totalWaitMs / servedCount / 60000);
        }

        waitList.sort((a, b) => a.joinedAtMs - b.joinedAtMs);

        let longestMins = 0;
        if (waitList.length > 0) {
           longestMins = Math.floor((new Date().getTime() - waitList[0].joinedAtMs) / 60000);
        }

        // Format data for the Recharts AreaChart
        const formattedHourlyData = Object.keys(hourCounts)
          .sort()
          .map(time => ({
            time,
            patients: hourCounts[time]
          }));

        setStats({
          waiting: waitingCount,
          serving: servingCount,
          served: servedCount,
          avgWaitMins: avgMins,
          longestWaitMins: longestMins,
          activeRooms: Array.from(rooms),
          waitingList: waitList,
        });
        
        setHourlyTrend(formattedHourlyData);
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
    <div className="px-8 py-6 flex flex-col gap-8 min-h-screen max-w-7xl mx-auto w-full">
      
      {/* 1. Header uses Props */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-red-50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center text-4xl">
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
        <div className="bg-white rounded-xl shadow-sm border border-red-50 p-6 flex flex-col justify-between h-36 w-64">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Waiting</span>
          <span className="text-orange-500 text-5xl font-extrabold self-end">{stats.waiting}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-red-50 p-6 flex flex-col justify-between h-36 w-64">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Currently Serving</span>
          <span className="text-green-600 text-5xl font-extrabold self-end">{stats.serving}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-red-50 p-6 flex flex-col justify-between h-36 w-64">
          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Done Today</span>
          <span className="text-gray-800 text-5xl font-extrabold self-end">{stats.served}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Detailed Up Next List */}
        <div className="bg-white rounded-xl shadow-sm border border-red-50 p-8 lg:col-span-2">
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
          <div className="bg-white rounded-xl shadow-sm border border-red-50 p-8">
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

      {/* 5. NEW: Hourly Trend Area Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-red-50 p-8 w-full mt-2">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-gray-800">Service Demand Trend</h2>
          <p className="text-sm text-gray-400 mt-1">Hourly patient arrivals for {title} today</p>
        </div>
        
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                axisLine={false} 
                tickLine={false} 
                domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              />
              <Tooltip 
                cursor={{ stroke: '#fca5a5', strokeWidth: 2, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={((value: number) => [`${value} patients`, 'Arrivals']) as any}
              />
              <Area 
                type="monotone" 
                dataKey="patients" 
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPatients)" 
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}