/**
 * @fileoverview Live ticket table component for the Admin Dashboard overview.
 *
 * Renders real-time patient queue tickets with dynamic service filtering, wait times,
 * and status badges adhering to the enterprise solid surfaces standard.
 *
 * @module app/dashboard/components/LiveQueueTable
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PatientRecord } from '@/app/dashboard/hooks/useOverviewData';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import StatusBadge from '@/app/dashboard/components/StatusBadge';
import { EMPTY_CELL, LIVE_QUEUE_COLUMNS, SECTIONS } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getPatientWaitEndTime } from '@/utils/waitTime';
import { ElapsedTimer } from '@/components/reusables/ElapsedTimer';
import { LiveQueueTableSkeleton } from '@/app/dashboard/components/skeletons/LiveQueueTableSkeleton';

const S = DASH.table;
const C = SECTIONS.liveQueue;

/**
 * Properties for LiveQueueTable component.
 */
export interface LiveQueueTableProps {
  /** Array of active patient records today */
  patients: PatientRecord[];
  /** Current Manila time reference for calculating active wait durations */
  currentTime: Date;
  /** Flag indicating whether component has completed client hydration */
  isMounted: boolean;
  /** Flag indicating whether queue data is actively loading */
  isLoading?: boolean;
}

/**
 * Live ticket list for the admin dashboard: today's patients, newest first,
 * with a client-side service filter. Row count is capped at
 * SECTIONS.liveQueue.limit; "View All Queues" links to the full patients page.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function LiveQueueTable({
  patients,
  currentTime,
  isMounted,
  isLoading = false,
}: LiveQueueTableProps) {
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const services = useMemo(
    () => Array.from(new Set(patients.map((p) => p.service).filter(Boolean))).sort(),
    [patients],
  );

  if (isLoading) return <LiveQueueTableSkeleton />;

  const filtered =
    serviceFilter === 'all' ? patients : patients.filter((p) => p.service === serviceFilter);
  const rows = filtered.slice(0, C.limit);

  const filterAction = (
    <select
      value={serviceFilter}
      onChange={(e) => setServiceFilter(e.target.value)}
      className={DASH.card.filterSelect}
      aria-label="Filter live queue by service"
    >
      <option
        value="all"
        className={DASH.card.selectOption}
      >
        {C.allServicesLabel}
      </option>
      {services.map((service) => (
        <option
          key={service}
          value={service}
          className={DASH.card.selectOption}
        >
          {service}
        </option>
      ))}
    </select>
  );

  return (
    <DashboardCard title={C.title} subtitle={C.subtitle} icon={C.icon} action={filterAction}>
      <div className={S.wrap}>
        <table className={`${S.table} min-w-[580px]`}>
          <thead>
            <tr className={S.headRow}>
              {LIVE_QUEUE_COLUMNS.map((col) => (
                <th key={col.key} className={`${S.th} whitespace-nowrap`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isMounted &&
              rows.map((patient) => (
                <tr key={patient.id} className={S.row}>
                  <td className={S.td}>
                    <span className={`${S.ticket} font-mono font-bold whitespace-nowrap`}>
                      {patient.patientNum || EMPTY_CELL}
                    </span>
                  </td>
                  <td className={`${S.td} whitespace-nowrap font-medium text-content`}>
                    {patient.service || 'General'}
                  </td>
                  <td className={`${S.td} whitespace-nowrap font-semibold text-content`}>
                    {patient.cubicleNum || EMPTY_CELL}
                  </td>
                  <td className={`${S.td} whitespace-nowrap font-mono text-xs tabular-nums`}>
                    <ElapsedTimer
                      startedAt={patient.created_at}
                      endedAt={getPatientWaitEndTime(patient)}
                      showHours={true}
                      includeSeconds={true}
                    />
                  </td>
                  <td className={`${S.td} whitespace-nowrap`}>
                    <StatusBadge status={patient.status || 'Pending'} />
                  </td>
                </tr>
              ))}
            {isMounted && rows.length === 0 && (
              <tr>
                <td colSpan={LIVE_QUEUE_COLUMNS.length} className={DASH.card.empty}>
                  {C.emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-line/60 pt-3">
        <span className="text-[11px] font-medium text-content-muted flex items-center gap-1.5">
          <i className="bx bx-shield-quarter text-emerald-600 dark:text-emerald-400 text-sm" />
          <span>RA 10173 Protected &bull; Contact identifiers masked</span>
        </span>
        <Link
          href={C.viewAllHref}
          className="flex items-center justify-end gap-1 text-xs font-semibold text-content-muted transition hover:text-[#a8071a] dark:hover:text-[#f87171]"
        >
          {C.viewAllLabel}
          <i className="bx bx-right-arrow-alt" />
        </Link>
      </div>
    </DashboardCard>
  );
}
