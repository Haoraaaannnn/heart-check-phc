/**
 * @fileoverview Data table component displaying staff user accounts in SuperAdmin.
 *
 * Provides real-time search input, role filter tabs, status pills, responsive
 * row interactions, edit/delete actions, and pagination controls.
 *
 * @module app/superadmin/components/UserTable
 */

import React from 'react';
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
  const S = SUPERADMIN_STYLES.table;
  const R = SUPERADMIN_STYLES.roles;
  const T = SUPERADMIN_TEXTS.table;

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
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
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
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-rose-600 border-t-transparent" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {T.loadingUsers}
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-2xl">
            <i className="bx bx-user-x" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {T.emptyTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
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
                      <div className="flex items-center gap-2.5 font-medium text-slate-900 dark:text-white">
                        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className={S.td}>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {user.username}
                      </span>
                    </td>
                    <td className={S.td}>
                      <span className={`${R.basePill} ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={S.td}>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
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
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer flex items-center gap-1"
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
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {T.showingText}{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {users.length > 0 ? (currentPage - 1) * 8 + 1 : 0}
              </span>{' '}
              {T.toText}{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * 8, totalUsers)}
              </span>{' '}
              {T.ofText}{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {totalUsers}
              </span>{' '}
              {T.resultsText}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                {T.pageText} {currentPage} {T.ofText} {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={S.pageButton}
              >
                {T.prevButton}
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={S.pageButton}
              >
                {T.nextButton}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
