/**
 * @fileoverview Table component displaying recent patient registrations from the last 30 days.
 *
 * Implements client-side pagination, status badges with semantic tone styling,
 * ticket formatting, and responsive table overflow wrappers.
 *
 * @module app/dashboard/pages/patients/components/RecentPatientTable
 */

'use client';

import { useState } from 'react';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { AllRecentPatient } from '@/types/Types';
import {
  PATIENTS_PER_PAGE,
  PATIENTS_STYLES,
  PATIENT_STATUS_COLORS,
} from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface RecentPatientsTableProps {
  /** Array of all recent patient records from the past 30 days. */
  patients: AllRecentPatient[];
}

/**
 * 30-day patient table with pagination and status styling.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function RecentPatientsTable({ patients }: RecentPatientsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const S = PATIENTS_STYLES.table;
  const T = PATIENTS_TEXTS.recentTable;

  const totalPages = Math.ceil(patients.length / PATIENTS_PER_PAGE) || 1;
  const startIdx = (currentPage - 1) * PATIENTS_PER_PAGE;
  const paginatedPatients = patients.slice(startIdx, startIdx + PATIENTS_PER_PAGE);

  const countBadge = patients.length > 0 ? (
    <div className={S.countBadge}>
      {T.showingPrefix}{' '}
      <span className={S.countHighlight}>{startIdx + 1}</span> {T.toText}{' '}
      <span className={S.countHighlight}>
        {Math.min(startIdx + PATIENTS_PER_PAGE, patients.length)}
      </span>{' '}
      {T.ofText} <span className={S.countHighlight}>{patients.length}</span> {T.patientsSuffix}
    </div>
  ) : null;

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-user-check"
      action={countBadge}
    >
      {patients.length === 0 ? (
        <div className={S.emptyWrap}>
          <p className={S.emptyTitle}>{T.emptyTitle}</p>
          <p className={S.emptySubtitle}>{T.emptySubtitle}</p>
        </div>
      ) : (
        <>
          <div className={S.wrap}>
            <table className={S.table}>
              <thead>
                <tr className={S.headRow}>
                  <th className={S.th}>{T.headers.patientNum}</th>
                  <th className={S.th}>{T.headers.service}</th>
                  <th className={S.th}>{T.headers.status}</th>
                  <th className={S.th}>{T.headers.time}</th>
                  <th className={S.th}>{T.headers.waitTime}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => {
                  const statusKey = (patient.status || '').toLowerCase();
                  const badgeStyle =
                    PATIENT_STATUS_COLORS[statusKey] || PATIENT_STATUS_COLORS.default;

                  return (
                    <tr key={patient.id} className={S.row}>
                      <td className={S.td}>
                        <span className={S.ticketBadge}>
                          {patient.patientNum || T.fallbackTicket}
                        </span>
                      </td>
                      <td className={`${S.td} font-semibold text-content`}>
                        {patient.service}
                      </td>
                      <td className={S.td}>
                        <span className={`${S.statusBadge} ${badgeStyle.bg} ${badgeStyle.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badgeStyle.dot}`} />
                          {patient.status}
                        </span>
                      </td>
                      <td className={S.td}>{patient.time}</td>
                      <td className={`${S.td} font-mono font-bold text-content`}>
                        {patient.waitTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={S.paginationWrap}>
              <span className={S.paginationInfo}>
                {T.pagination.page} {currentPage} {T.ofText} {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={S.paginationButton}
                >
                  {T.pagination.previous}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={S.paginationButton}
                >
                  {T.pagination.next}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}
