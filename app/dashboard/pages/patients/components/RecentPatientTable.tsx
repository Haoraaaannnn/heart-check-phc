/**
 * @fileoverview Table component displaying recent patient registrations from the last 30 days.
 *
 * Implements real-time search filtering across ticket numbers, services, statuses, and timestamps.
 * Features advanced windowed pagination, direct page-number jumping, rows-per-page selection,
 * semantic tone status badges, and solid surface borders.
 *
 * @module app/dashboard/pages/patients/components/RecentPatientTable
 */

'use client';

import React, { useState, useMemo } from 'react';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { AllRecentPatient } from '@/types/Types';
import {
  PATIENTS_PER_PAGE,
  PATIENTS_STYLES,
  PATIENT_STATUS_COLORS,
} from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

/**
 * Properties for RecentPatientsTable component.
 */
export interface RecentPatientsTableProps {
  /** Array of all recent patient records from the past 30 days. */
  patients: AllRecentPatient[];
}

/**
 * Generates an array of page numbers and ellipsis tokens for pagination windowing.
 *
 * @param currentPage - The currently active 1-indexed page.
 * @param totalPages - Total count of available pages.
 * @returns Array containing page numbers and '...' strings.
 */
function getPaginationWindow(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

/**
 * 30-day patient table with real-time search filtering, windowed pagination, and direct page jumping.
 *
 * @param props - Component properties containing the recent patients dataset.
 * @returns JSX element.
 */
export default function RecentPatientsTable({ patients }: RecentPatientsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(PATIENTS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  const S = PATIENTS_STYLES.table;
  const T = PATIENTS_TEXTS.recentTable;

  // Filter patients by search query across ticket #, service, status, or date
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter((patient) => {
      const ticket = (patient.patientNum || '').toLowerCase();
      const service = (patient.service || '').toLowerCase();
      const status = (patient.status || '').toLowerCase();
      const time = (patient.time || patient.createdAt || '').toLowerCase();

      return (
        ticket.includes(q) ||
        service.includes(q) ||
        status.includes(q) ||
        time.includes(q)
      );
    });
  }, [patients, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const paginatedPatients = filteredPatients.slice(startIdx, startIdx + pageSize);

  const paginationWindow = useMemo(
    () => getPaginationWindow(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpPageInput('');
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const isFiltered = searchQuery.trim().length > 0;

  const countBadge = patients.length > 0 ? (
    <div className={S.countBadge}>
      {T.showingPrefix}{' '}
      <span className={S.countHighlight}>
        {filteredPatients.length > 0 ? startIdx + 1 : 0}
      </span>{' '}
      {T.toText}{' '}
      <span className={S.countHighlight}>
        {Math.min(startIdx + pageSize, filteredPatients.length)}
      </span>{' '}
      {T.ofText}{' '}
      <span className={S.countHighlight}>{filteredPatients.length}</span>{' '}
      {T.patientsSuffix}
      {isFiltered && (
        <span className="text-content-subtle ml-1">
          ({T.filteredFrom} {patients.length} {T.totalText})
        </span>
      )}
    </div>
  ) : null;

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-user-check"
      action={countBadge}
    >
      {/* Search Filter Toolbar */}
      <div className={S.toolbar}>
        <div className={S.searchWrap}>
          <i className={`bx bx-search ${S.searchIcon}`} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={T.searchPlaceholder}
            aria-label={T.searchAriaLabel}
            className={S.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={S.clearSearchButton}
              aria-label={T.clearSearchAria}
            >
              <i className="bx bx-x text-base" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Rows per page selector */}
        <div className="flex items-center gap-2 text-xs text-content-muted self-end sm:self-auto">
          <span>{T.pagination.rowsPerPage}</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs font-semibold text-content outline-none cursor-pointer"
            aria-label="Rows per page"
          >
            <option
              value={25}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              25
            </option>
            <option
              value={50}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              50
            </option>
            <option
              value={100}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              100
            </option>
          </select>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className={S.emptyWrap}>
          <p className={S.emptyTitle}>{T.emptyTitle}</p>
          <p className={S.emptySubtitle}>{T.emptySubtitle}</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className={S.emptyWrap}>
          <p className={S.emptyTitle}>{T.noSearchResultsTitle}</p>
          <p className={S.emptySubtitle}>{T.noSearchResultsSubtitle}</p>
          <button
            type="button"
            onClick={handleClearSearch}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-content transition hover:bg-surface-muted cursor-pointer"
          >
            <i className="bx bx-x" aria-hidden="true" />
            <span>{T.clearSearchAria}</span>
          </button>
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
                      <td className={S.td}>{patient.time || patient.createdAt}</td>
                      <td className={`${S.td} font-mono font-bold text-content`}>
                        {patient.waitTime !== undefined ? `${patient.waitTime}m` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Advanced Pagination Bar */}
          {totalPages > 1 && (
            <div className={S.paginationWrap}>
              {/* Left: Page Info */}
              <span className={S.paginationInfo}>
                {T.pagination.page} {safeCurrentPage} {T.ofText} {totalPages}
              </span>

              {/* Center: Windowed Page Buttons & Navigation */}
              <div className={S.paginationGroup}>
                {/* First Page Button */}
                <button
                  type="button"
                  onClick={() => handlePageSelect(1)}
                  disabled={safeCurrentPage === 1}
                  className={S.paginationButton}
                  title={T.pagination.first}
                  aria-label={T.pagination.first}
                >
                  <i className="bx bx-chevrons-left text-sm" aria-hidden="true" />
                </button>

                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageSelect(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className={S.paginationButton}
                  title={T.pagination.previous}
                  aria-label={T.pagination.previous}
                >
                  <i className="bx bx-chevron-left text-sm" aria-hidden="true" />
                </button>

                {/* Numbered Page Buttons with Windowing */}
                {paginationWindow.map((item, index) => {
                  if (typeof item === 'string') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-1 text-xs text-content-subtle select-none font-semibold"
                      >
                        {item}
                      </span>
                    );
                  }

                  const isActive = item === safeCurrentPage;
                  return (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => handlePageSelect(item)}
                      aria-current={isActive ? 'page' : undefined}
                      className={isActive ? S.pageButtonActive : S.pageButtonIdle}
                    >
                      {item}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageSelect(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className={S.paginationButton}
                  title={T.pagination.next}
                  aria-label={T.pagination.next}
                >
                  <i className="bx bx-chevron-right text-sm" aria-hidden="true" />
                </button>

                {/* Last Page Button */}
                <button
                  type="button"
                  onClick={() => handlePageSelect(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className={S.paginationButton}
                  title={T.pagination.last}
                  aria-label={T.pagination.last}
                >
                  <i className="bx bx-chevrons-right text-sm" aria-hidden="true" />
                </button>
              </div>

              {/* Right: Direct "Go to Page" Jump Form */}
              <form onSubmit={handleJumpSubmit} className={S.pageJumpWrap}>
                <span>{T.pagination.goTo}</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder={String(safeCurrentPage)}
                  className={S.pageJumpInput}
                  aria-label={T.pagination.goTo}
                />
                <button
                  type="submit"
                  disabled={!jumpPageInput}
                  className={S.pageJumpButton}
                >
                  {T.pagination.jump}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}
