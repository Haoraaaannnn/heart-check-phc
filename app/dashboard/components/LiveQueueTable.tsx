'use client';

import { useMemo, useState } from 'react';
import type { PatientRecord } from '@/app/dashboard/hooks/useOverviewData';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import StatusBadge from '@/app/dashboard/components/StatusBadge';
import { EMPTY_CELL, LIVE_QUEUE_COLUMNS, SECTIONS } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getPatientWaitTime } from '@/utils/waitTime';

const S = DASH.table;
const C = SECTIONS.liveQueue;

interface LiveQueueTableProps {
  patients: PatientRecord[];
  currentTime: Date;
  isMounted: boolean;
}

/**
 * Live ticket list for the admin dashboard: today's patients, newest first,
 * with a client-side service filter. Row count is capped at
 * SECTIONS.liveQueue.limit; "View All Queues" links to the full patients page.
 */
export default function LiveQueueTable({ patients, currentTime, isMounted }: LiveQueueTableProps) {
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const services = useMemo(
    () => Array.from(new Set(patients.map((p) => p.service).filter(Boolean))).sort(),
    [patients],
  );

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
      <option value="all">{C.allServicesLabel}</option>
      {services.map((service) => (
        <option key={service} value={service}>
          {service}
        </option>
      ))}
    </select>
  );

  return (
    <DashboardCard title={C.title} subtitle={C.subtitle} icon={C.icon} action={filterAction}>
      <div className={S.wrap}>
        <table className={S.table}>
          <thead>
            <tr className={S.headRow}>
              {LIVE_QUEUE_COLUMNS.map((col) => (
                <th key={col.key} className={S.th}>
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
                    <span className={S.ticket}>{patient.patientNum || EMPTY_CELL}</span>
                  </td>
                  <td className={S.td}>{patient.service || 'General'}</td>
                  <td className={S.td}>{patient.cubicleNum || EMPTY_CELL}</td>
                  <td className={S.td}>{getPatientWaitTime(patient, currentTime)} min</td>
                  <td className={S.td}>
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

      <a href={C.viewAllHref} className={DASH.card.footerLink}>
        {C.viewAllLabel}
        <i className="bx bx-right-arrow-alt" />
      </a>
    </DashboardCard>
  );
}