'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import ServiceMetricCard from '@/components/reusables/serviceMetricCard';
import { useServiceQueue } from '../hooks/useServiceQueue';

const BOTTLENECK_MINS = 60;

interface ServiceQueuePanelProps {
  service: string;
}

export default function ServiceQueuePanel({ service }: ServiceQueuePanelProps) {
  const { stats, hourlyTrend } = useServiceQueue(service);
  const [now, setNow] = useState(() => Date.now());

  // Ticks every minute so "Waiting For" stays live between realtime events
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const liveWaitMins = (joinedAtMs: number) =>
    Math.max(0, Math.floor((now - joinedAtMs) / 60000));

  const isActive = stats.serving > 0;
  const isBottleneck = stats.longestWaitMins > BOTTLENECK_MINS;

  return (
    <div className="flex flex-col gap-6">
      {/* Status strip */}
      <div className="flex items-center gap-3">
        {isActive ? (
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold uppercase rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-100 dark:bg-[#242424] text-slate-500 dark:text-[#a3a3a3] text-xs font-extrabold uppercase rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-[#737373]" /> Standby
          </span>
        )}
        {stats.activeRooms.length > 0 && (
          <span className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">
            Rooms:{' '}
            <span className="text-slate-800 dark:text-[#f5f5f5]">
              {stats.activeRooms.join(', ')}
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Up Next */}
        <ServiceMetricCard className="lg:col-span-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#f5f5f5] mb-6">
            Up Next Queue
          </h2>

          <div className="flex flex-col gap-3">
            {stats.waitingList.length > 0 ? (
              stats.waitingList.map((patient, idx) => {
                const mins = liveWaitMins(patient.joinedAtMs);
                const overdue = mins > BOTTLENECK_MINS;
                const isNext = idx === 0;

                return (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                      isNext
                        ? 'bg-[#a8071a]/5 dark:bg-[#a8071a]/15 border-[#a8071a]/25 dark:border-[#a8071a]/30'
                        : 'bg-slate-50 dark:bg-[#1a1a1a] border-slate-200 dark:border-[#2e2e2e]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-2xl font-extrabold ${
                          isNext
                            ? 'text-[#a8071a] dark:text-[#f87171]'
                            : 'text-slate-800 dark:text-[#f5f5f5]'
                        }`}
                      >
                        {idx + 1}. {patient.ticket}
                      </span>
                      {isNext && (
                        <span className="px-2 py-1 bg-[#a8071a] text-white text-xs font-bold rounded uppercase">
                          Next
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-400 dark:text-[#737373] uppercase mb-1">
                        Waiting For
                      </span>
                      <span
                        className={`text-lg font-extrabold ${
                          overdue
                            ? 'text-[#a8071a] dark:text-[#f87171]'
                            : 'text-slate-900 dark:text-[#f5f5f5]'
                        }`}
                      >
                        {mins} mins
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-[#737373] italic">
                No patients waiting in this queue.
              </div>
            )}
          </div>
        </ServiceMetricCard>

        {/* Time stats */}
        <ServiceMetricCard>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-slate-500 dark:text-[#a3a3a3]">
            Time Stats
          </h3>

          <div className="flex flex-col gap-6">
            <div>
              <span className="text-slate-500 dark:text-[#a3a3a3] font-semibold block mb-1">
                Average Wait Time
              </span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-[#f5f5f5]">
                {stats.avgWaitMins !== null ? `${stats.avgWaitMins} min` : '--'}
              </span>
            </div>

            <hr className="border-slate-200 dark:border-[#2e2e2e]" />

            <div>
              <span className="text-slate-500 dark:text-[#a3a3a3] font-semibold block mb-1">
                Longest Wait (Bottleneck)
              </span>
              <span
                className={`text-3xl font-extrabold ${
                  isBottleneck
                    ? 'text-[#a8071a] dark:text-[#f87171]'
                    : 'text-slate-900 dark:text-[#f5f5f5]'
                }`}
              >
                {stats.longestWaitMins > 0 ? `${stats.longestWaitMins} min` : '--'}
              </span>
              {isBottleneck && (
                <p className="text-xs text-[#a8071a] dark:text-[#f87171] font-bold mt-2">
                  Alert: Patient waiting over 1 hour!
                </p>
              )}
            </div>
          </div>
        </ServiceMetricCard>
      </div>

      {/* Demand trend */}
      <ServiceMetricCard>
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-[#f5f5f5]">
            Service Demand Trend
          </h2>
          <p className="text-sm text-slate-400 dark:text-[#737373] mt-1">
            Hourly patient arrivals for {service} today
          </p>
        </div>

        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a8071a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a8071a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(115,115,115,0.15)" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#a3a3a3' }}
                axisLine={false}
                tickLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              />
              <Tooltip
                cursor={{ stroke: '#a8071a', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #2e2e2e', backgroundColor: '#1a1a1a', color: '#f5f5f5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value} patients`, 'Arrivals'] as [string, string]}
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#a8071a"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPatients)"
                activeDot={{ r: 6, fill: '#a8071a', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ServiceMetricCard>
    </div>
  );
}