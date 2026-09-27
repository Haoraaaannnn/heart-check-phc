/**
 * @fileoverview Fixed top header bar component for the Nurse Dashboard.
 *
 * Displays clinical navigation metadata, active room/cubicle filters, attending physician
 * indicators, synchronization state, finished ledger drawer triggers, and notification dropdown.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React from 'react';
import NotificationDropdown from '@/app/dashboard/components/NotificationDropdown';
import { AssignedNurseCubicle } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';
import { NurseStyle } from '../constants/nurse';

/**
 * Props for the NurseHeader component.
 */
export interface NurseHeaderProps {
  /** Whether a background data sync is actively in flight. */
  isSyncing: boolean;
  /** Active category filter, or null if all categories visible. */
  selectedCategory: string | null;
  /** Active cubicle number filter, or null if all cubicles visible. */
  selectedCubicleNum: string | null;
  /** List of cubicles assigned to the user or hospital. */
  assignedCubicles: AssignedNurseCubicle[];
  /** Total count of completed patients in today's ledger. */
  finishedCount: number;
  /** Callback to open the finished patient ledger drawer. */
  onOpenFinishedLedger: () => void;
  /** Callback to clear active category and cubicle filters. */
  onClearFilter: () => void;
  /** Notifications dataset for the workstation. */
  notifications: any[];
  /** Unread notification count. */
  unreadCount: number;
  /** Notification handlers. */
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismissNotification: (id: string) => void;
  onClearAllNotifications: () => void;
}

/**
 * Renders the top navigation and status bar for the Nurse Station.
 *
 * @param props - Header metadata, filter states, and notification triggers.
 * @returns The rendered fixed header element.
 */
export function NurseHeader({
  isSyncing,
  selectedCategory,
  selectedCubicleNum,
  assignedCubicles,
  finishedCount,
  onOpenFinishedLedger,
  onClearFilter,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismissNotification,
  onClearAllNotifications,
}: NurseHeaderProps) {
  // Find attending physician if a single cubicle is selected
  const activeCubicle = selectedCubicleNum
    ? assignedCubicles.find((c) => c.cubicleNum === selectedCubicleNum)
    : null;

  const doctorName = activeCubicle?.doctorName;

  return (
    <header style={NurseStyle.headerBar}>
      {/* Left: Station Title & Active Filters */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <i className="bx bx-user-plus text-slate-400 text-lg" aria-hidden="true" />
          <span className="text-slate-600 text-sm font-semibold tracking-tight">
            {nurseTexts.patientManagement}
          </span>
        </div>

        {/* Active Filter Badge */}
        {(selectedCategory || selectedCubicleNum) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <span className="font-medium text-slate-400">
              {nurseTexts.filteredByPrefix}
            </span>
            <span className="font-bold text-slate-800">
              {selectedCubicleNum
                ? `${nurseTexts.cubiclePrefix} ${selectedCubicleNum}`
                : selectedCategory}
            </span>
            <button
              type="button"
              onClick={onClearFilter}
              className="ml-1 text-slate-400 hover:text-[#cc3535] cursor-pointer"
              title={nurseTexts.clearFilter}
              aria-label={nurseTexts.clearFilter}
            >
              <i className="bx bx-x text-sm" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Attending Physician Indicator */}
        {selectedCubicleNum && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs border border-purple-100">
            <i className="bx bx-plus-medical text-[11px]" aria-hidden="true" />
            <span className="font-medium text-purple-600">{nurseTexts.doctorOnDuty}</span>
            <span className="font-bold">{doctorName || nurseTexts.noDoctorAssigned}</span>
          </div>
        )}
      </div>

      {/* Right: Sync Status, Finished Ledger Button & Notifications */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sync Indicator */}
        {isSyncing ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-600 font-semibold">
              {nurseTexts.syncingBadge}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-xs text-emerald-700 font-semibold">
              {nurseTexts.liveStatus}
            </span>
          </div>
        )}

        {/* Finished Ledger Drawer Button */}
        <button
          type="button"
          onClick={onOpenFinishedLedger}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          title={nurseTexts.viewFinishedLedger}
        >
          <i className="bx bx-check-double text-base text-emerald-600" aria-hidden="true" />
          <span className="hidden sm:inline">{nurseTexts.stageFinishedHeading}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            {finishedCount}
          </span>
        </button>

        {/* Bottleneck Alerts & Notifications */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDismiss={onDismissNotification}
          onClearAll={onClearAllNotifications}
        />
      </div>
    </header>
  );
}

export default NurseHeader;
