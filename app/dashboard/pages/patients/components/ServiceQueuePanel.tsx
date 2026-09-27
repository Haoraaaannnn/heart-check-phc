/**
 * @fileoverview Live service queue panel displaying currently waiting patients,
 * active rooms, real-time wait duration, and hourly intake charts.
 *
 * @module app/dashboard/pages/patients/components/ServiceQueuePanel
 */

'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { useServiceQueue } from '@/app/dashboard/pages/patients/hooks/useServiceQueue';
import {
  BOTTLENECK_MINS,
  PATIENTS_STYLES,
} from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface ServiceQueuePanelProps {
  /** The selected service name to track in real time. */
  service: string;
}

/**
 * Service queue inspection panel displaying up next tickets and hourly trends.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ServiceQueuePanel({ service }: ServiceQueuePanelProps) {
  const { stats, hourlyTrend } = useServiceQueue(service);
  const [now, setNow] = useState(() => Date.now());
  const S = PATIENTS_STYLES.serviceQueue;
  const T = PATIENTS_TEXTS.serviceQueue;

  // Ticks every minute so waiting time remains current between database updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const liveWaitMins = (joinedAtMs: number) =>
    Math.max(0, Math.floor((now - joinedAtMs) / 60000));

  const isActive = stats.serving > 0;

  const statusStrip = (
    <div className={S.statusStrip}>
      {isActive ? (
        <span className={S.badgeActive}>
          <span className={S.indicatorDotActive} />
          {T.statusActive}
        </span>
      ) : (
        <span className={S.badgeStandby}>
          <span className={S.indicatorDotStandby} />
          {T.statusStandby}
        </span>
      )}
      {stats.activeRooms.length > 0 && (
        <span className={S.roomsText}>
          {T.roomsLabel}{' '}
          <span className={S.roomsValue}>{stats.activeRooms.join(', ')}</span>
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className={S.mainGrid}>
        {/* Up Next List */}
        <div className={S.queueCardCol}>
          <DashboardCard
            title={T.upNextTitle}
            subtitle={T.upNextSubtitle}
            icon="bx-list-ol"
            action={statusStrip}
          >
            <div className="flex flex-col gap-3">
              {stats.waitingList.length > 0 ? (
                stats.waitingList.map((patient, idx) => {
                  const mins = liveWaitMins(patient.joinedAtMs);
                  const isOverdue = mins > BOTTLENECK_MINS;
                  const isNext = idx === 0;

                  return (
                    <div
                      key={patient.id}
                      className={isNext ? S.patientItemNext : S.patientItem}
                    >
                      <div className={S.patientInfo}>
                        <span className={S.patientNumber}>{patient.ticket}</span>
                        <div className={S.patientMeta}>
                          <span className={S.patientName}>
                            {isNext ? `★ ${T.servingBadge}` : `${T.waitingPrefix} ${mins}m`}
                          </span>
                          <span className={S.patientWait}>
                            {T.waitingPrefix} {mins} mins
                          </span>
                        </div>
                      </div>

                      {isOverdue && (
                        <span className={S.overduePill}>
                          <i className="bx bx-error-circle" />
                          {T.overdueWarning} ({mins}m)
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-sm italic text-content-muted">
                  {T.emptyQueue}
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Hourly Trend for this service */}
        <div className={S.chartCardCol}>
          <DashboardCard
            title={T.hourlyTrendTitle}
            subtitle={T.hourlyTrendSubtitle}
            icon="bx-trending-up"
          >
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hourlyTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="serviceTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cc3535" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#cc3535" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-line, #e5e7eb)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: 'var(--color-content-muted, #6b7280)' }}
                    axisLine={{ stroke: 'var(--color-line, #e5e7eb)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: 'var(--color-content-muted, #6b7280)' }}
                    axisLine={{ stroke: 'var(--color-line, #e5e7eb)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface, #ffffff)',
                      borderColor: 'var(--color-line, #e5e7eb)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      color: 'var(--color-content, #1f2937)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="#cc3535"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#serviceTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
