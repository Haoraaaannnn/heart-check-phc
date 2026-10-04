/**
 * @fileoverview Data table component displaying staff user accounts in SuperAdmin.
 *
 * Provides real-time search input, role filter tabs, status pills, responsive
 * row interactions, edit/delete actions, and pagination controls.
 *
 * @module app/superadmin/components/UserTable
 */

import React, { useState } from 'react';
import { SuperadminUser } from '../types/superadmin';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface UserTableProps {
  /** Array of paginated users to render. */
  users: SuperadminUser[];
  /** Whether user query is currently loading. */
  loading: boolean;
  /** Active search query string. */
  searchQuery: string;
  /** Search query change handler. */
  onSearchChange: (q: string) => void;
  /** Active role filter ('all' or specific role). */
  roleFilter: string;
  /** Role filter change handler. */
  onRoleFilterChange: (role: string) => void;
  /** Current page index (1-based). */
  currentPage: number;
  /** Total available pages. */
  totalPages: number;
  /** Total matching users count. */
  totalUsers: number;
  /** Handler to change the active page. */
  onPageChange: (page: number) => void;
  /** Action handler when user clicks edit. */
  onEditUser: (user: SuperadminUser) => void;
  /** Action handler when user clicks delete. */
  onDeleteUser: (user: SuperadminUser) => void;
}

const ROLE_OPTIONS = [
  { key: 'all', label: 'All Roles' },
  { key: 'superadmin', label: 'SuperAdmin' },
  { key: 'admin', label: 'Admin' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'nurse', label: 'Nurse' },
  { key: 'registration', label: 'Registration' },
];

/**
 * Generates an array of page numbers and ellipsis tokens for pagination windowing.
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
 * Staff accounts data table with search and pagination.
 *
 * @param props - Component properties.
 * @returns JSX element containing the user table.
 */
export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  currentPage,
  totalPages,
  totalUsers,
  onPageChange,
  onEditUser,
  onDeleteUser,
}) => {
  const [jumpPageInput, setJumpPageInput] = useState('');
  const S = SUPERADMIN_STYLES.table;
  const R = SUPERADMIN_STYLES.roles;
  const T = SUPERADMIN_TEXTS.table;

  const paginationWindow = getPaginationWindow(currentPage, totalPages);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPageInput('');
    }
  };

  /**
   * Resolves the styling classes for a specific role string.
   */
  const getRoleBadgeClass = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return R.superadmin;
      case 'admin':
        return R.admin;
      case 'doctor':
        return R.doctor;
      case 'nurse':
        return R.nurse;
      case 'registration':
        return R.registration;
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-[#2e2e2e] dark:text-[#a3a3a3]';
    }
  };

  return (
    <div className={S.container}>
      {/* Search & Filter Toolbar */}
      <div className={S.toolbar}>
        <div className={S.searchWrapper}>
          <i className={`bx bx-search ${S.searchIcon}`} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={T.searchPlaceholder}
            className={S.searchInput}
          />
        </div>

        <div className={S.filterGroup}>
          <span className="text-xs text-slate-500 dark:text-[#a3a3a3] font-medium hidden sm:inline">
            {T.filterLabel}
          </span>
          {ROLE_OPTIONS.map((opt) => {
            const isActive = roleFilter.toLowerCase() === opt.key.toLowerCase();
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onRoleFilterChange(opt.key)}
                className={`${S.filterPill} ${
                  isActive ? S.filterPillActive : S.filterPillIdle
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#a8071a] border-t-transparent" />
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] font-medium">
            {T.loadingUsers}
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#242424] text-slate-400 mx-auto flex items-center justify-center text-2xl">
            <i className="bx bx-user-x" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-[#f5f5f5]">
            {T.emptyTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
            {T.emptyDesc}
          </p>
        </div>
      ) : (
        <>
          <div className={S.tableWrapper}>
            <table className={S.table}>
              <thead className={S.thead}>
                <tr>
                  <th className={S.th}>{T.colEmail}</th>
                  <th className={S.th}>{T.colUsername}</th>
                  <th className={S.th}>{T.colRole}</th>
                  <th className={S.th}>{T.colCreated}</th>
                  <th className={`${S.th} text-right`}>{T.colActions}</th>
                </tr>
              </thead>
              <tbody className={S.tbody}>
                {users.map((user) => (
                  <tr key={user.auth_id} className={S.tr}>
                    <td className={S.td}>
                      <div className="flex items-center gap-2.5 font-medium text-slate-900 dark:text-[#f5f5f5]">
                        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#242424] text-slate-600 dark:text-[#a3a3a3] flex items-center justify-center text-xs font-bold">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className={S.td}>
                      <span className="font-mono text-xs text-slate-600 dark:text-[#a3a3a3]">
                        {user.username}
                      </span>
                    </td>
                    <td className={S.td}>
                      <span className={`${R.basePill} ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={S.td}>
                      <span className="text-xs text-slate-500 dark:text-[#a3a3a3]">
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className={`${S.td} text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditUser(user)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#a8071a] dark:text-[#f87171] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="bx bx-edit-alt text-sm" aria-hidden="true" />
                          <span>{T.editButton}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="bx bx-trash text-sm" aria-hidden="true" />
                          <span>{T.deleteButton}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className={S.pagination}>
            <span className="text-xs text-slate-500 dark:text-[#a3a3a3]">
              {T.showingText}{' '}
              <span className="font-semibold text-slate-800 dark:text-[#f5f5f5]">
                {users.length > 0 ? (currentPage - 1) * 8 + 1 : 0}
              </span>{' '}
              {T.toText}{' '}
              <span className="font-semibold text-slate-800 dark:text-[#f5f5f5]">
                {Math.min(currentPage * 8, totalUsers)}
              </span>{' '}
              {T.ofText}{' '}
              <span className="font-semibold text-slate-800 dark:text-[#f5f5f5]">
                {totalUsers}
              </span>{' '}
              {T.resultsText}
            </span>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* First Page Button */}
              <button
                type="button"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={S.pageButton}
                title="First page"
                aria-label="First page"
              >
                <i className="bx bx-chevrons-left text-sm" aria-hidden="true" />
              </button>

              {/* Prev Button */}
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={S.pageButton}
                title={T.prevButton}
                aria-label={T.prevButton}
              >
                <i className="bx bx-chevron-left text-sm" aria-hidden="true" />
              </button>

              {/* Numbered Page Window */}
              {paginationWindow.map((item, index) => {
                if (typeof item === 'string') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 py-1 text-xs text-slate-400 select-none font-semibold"
                    >
                      {item}
                    </span>
                  );
                }

                const isActive = item === currentPage;
                return (
                  <button
                    key={`page-${item}`}
                    type="button"
                    onClick={() => onPageChange(item)}
                    aria-current={isActive ? 'page' : undefined}
                    className={isActive ? S.pageButtonActive : S.pageButton}
                  >
                    {item}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={S.pageButton}
                title={T.nextButton}
                aria-label={T.nextButton}
              >
                <i className="bx bx-chevron-right text-sm" aria-hidden="true" />
              </button>

              {/* Last Page Button */}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={S.pageButton}
                title="Last page"
                aria-label="Last page"
              >
                <i className="bx bx-chevrons-right text-sm" aria-hidden="true" />
              </button>
            </div>

            {/* Jump to page form */}
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#a3a3a3]">
              <span>Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={String(currentPage)}
                className={S.pageJumpInput}
                aria-label="Go to page"
              />
              <button
                type="submit"
                disabled={!jumpPageInput}
                className={S.pageJumpButton}
              >
                Go
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
