/**
 * @fileoverview Skeletal placeholder component for the SuperAdmin UserTable widget.
 *
 * Renders toolbar filter skeletons, table header columns, row placeholders with
 * avatar circles and badge pills, and pagination controls.
 *
 * @module app/superadmin/components/UserTableSkeleton
 */

import React from 'react';
import { SUPERADMIN_SKELETON_STYLES } from '../constants/superadminSkeletonStyles';
import { SUPERADMIN_SKELETON_TEXTS } from '../constants/superadminSkeletonTexts';

const ROW_KEYS = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5', 'row-6'] as const;
const FILTER_KEYS = ['filter-1', 'filter-2', 'filter-3', 'filter-4', 'filter-5', 'filter-6'] as const;
const PAGE_BUTTONS = ['btn-1', 'btn-2', 'btn-3'] as const;

export interface UserTableSkeletonProps {
  /**
   * Whether to include the outer card container and top search/filter toolbar.
   * Set to false when embedding inside UserTable where the toolbar is already rendered.
   * Defaults to true.
   */
  includeToolbar?: boolean;
}

/**
 * Renders skeletal table rows and pagination controls for staff accounts.
 *
 * @param props - Component options including toolbar visibility flag.
 * @returns JSX element containing the user table skeleton.
 */
export function UserTableSkeleton({
  includeToolbar = true,
}: UserTableSkeletonProps): React.ReactElement {
  const S = SUPERADMIN_SKELETON_STYLES.table;

  const tableBody = (
    <>
      <div className={S.tableWrapper}>
        <table className={S.table}>
          <thead className={S.thead}>
            <tr>
              <th className={S.th}><div className={`${S.thBar} w-24`} /></th>
              <th className={S.th}><div className={`${S.thBar} w-20`} /></th>
              <th className={S.th}><div className={`${S.thBar} w-16`} /></th>
              <th className={S.th}><div className={`${S.thBar} w-20`} /></th>
              <th className={`${S.th} text-right`}><div className={`${S.thBar} w-16 ml-auto`} /></th>
            </tr>
          </thead>
          <tbody className={S.tbody}>
            {ROW_KEYS.map((key) => (
              <tr key={key} className={S.tr}>
                {/* Email + Avatar */}
                <td className={S.td}>
                  <div className="flex items-center gap-2.5">
                    <div className={S.avatar} />
                    <div className={`${S.textBar} w-36 sm:w-44`} />
                  </div>
                </td>
                {/* Username */}
                <td className={S.td}>
                  <div className={`${S.textBar} w-24`} />
                </td>
                {/* Role badge */}
                <td className={S.td}>
                  <div className={S.rolePill} />
                </td>
                {/* Created date */}
                <td className={S.td}>
                  <div className={`${S.textBar} w-20`} />
                </td>
                {/* Action buttons */}
                <td className={`${S.td} text-right`}>
                  <div className="flex items-center justify-end gap-2">
                    <div className={S.actionButton} />
                    <div className={S.actionButton} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar Skeleton */}
      <div className={S.pagination}>
        <div className={S.paginationText} />
        <div className={S.paginationButtons}>
          <div className={S.pageButton} />
          {PAGE_BUTTONS.map((btnKey) => (
            <div key={btnKey} className={S.pageButton} />
          ))}
          <div className={S.pageButton} />
        </div>
      </div>
    </>
  );

  if (!includeToolbar) {
    return (
      <div role="status" aria-label={SUPERADMIN_SKELETON_TEXTS.aria.loadingTable}>
        {tableBody}
      </div>
    );
  }

  return (
    <div
      className={S.container}
      role="status"
      aria-label={SUPERADMIN_SKELETON_TEXTS.aria.loadingTable}
    >
      {/* Search & Filter Toolbar Skeleton */}
      <div className={S.toolbar}>
        <div className={S.searchWrapper} />
        <div className={S.filterGroup}>
          {FILTER_KEYS.map((fKey) => (
            <div key={fKey} className={S.filterPill} />
          ))}
        </div>
      </div>

      {tableBody}
    </div>
  );
}

export default UserTableSkeleton;
