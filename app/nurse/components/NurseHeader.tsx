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
  /** Callback to select a service category filter. */
  onSelectCategory?: (category: string | null) => void;
  /** Callback to select an individual cubicle filter. */
  onSelectCubicle?: (cubicleNum: string) => void;
  /** Whether the cubicle/category dropdown selector should be displayed. Defaults to false. */
  showCubicleDropdown?: boolean;
  /** Whether the sidebar is currently open/visible. */
  isSidebarOpen?: boolean;
  /** Callback fired to toggle or close the sidebar. */
  onToggleSidebar?: () => void;
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
  onSelectCategory,
  onSelectCubicle,
  showCubicleDropdown = false,
  isSidebarOpen = true,
  onToggleSidebar,
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

  // Group cubicles by service category for desktop dropdown
  const services = React.useMemo(
    () =>
      assignedCubicles.reduce<Record<string, AssignedNurseCubicle[]>>(
        (groups, cubicle) => {
          groups[cubicle.category] ??= [];
          groups[cubicle.category].push(cubicle);
          return groups;
        },
        {}
      ),
    [assignedCubicles]
  );

  return (
    <header style={NurseStyle.headerBar}>
      {/* Left: Sidebar Toggle, Station Title & Active Filters / Desktop Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Sidebar Hide/Open Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0"
            title={isSidebarOpen ? nurseTexts.collapseSidebar : nurseTexts.expandSidebar}
            aria-label={isSidebarOpen ? nurseTexts.collapseSidebar : nurseTexts.expandSidebar}
          >
            <i
              className={`bx ${isSidebarOpen ? 'bx-chevron-left' : 'bx-menu'} text-xl block`}
              aria-hidden="true"
            />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-600 text-sm font-semibold tracking-tight">
            {nurseTexts.patientManagement}
          </span>
        </div>

        {/* Desktop Station / Cubicle Selector Dropdown */}
        {showCubicleDropdown && onSelectCategory && onSelectCubicle && assignedCubicles.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-xl px-2.5 py-1 transition-colors shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              {nurseTexts.cubicleSelectLabel}
            </span>
            <select
              value={
                selectedCubicleNum
                  ? selectedCubicleNum
                  : selectedCategory
                  ? `CAT:${selectedCategory}`
                  : 'ALL'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  onClearFilter();
                } else if (val.startsWith('CAT:')) {
                  onSelectCategory(val.slice(4));
                } else {
                  onSelectCubicle(val);
                }
              }}
              aria-label={nurseTexts.selectCubicleDropdown}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer py-0.5 pr-1 max-w-[220px] truncate"
            >
              <option value="ALL">{nurseTexts.allMyCubicles}</option>
              {Object.entries(services).map(([service, cubicles]) => (
                <optgroup key={service} label={service}>
                  <option value={`CAT:${service}`}>
                    {service} ({nurseTexts.allShort})
                  </option>
                  {cubicles.map((c) => (
                    <option key={c.id} value={c.cubicleNum}>
                      {nurseTexts.cubiclePrefix} {c.cubicleNum} - {nurseTexts.roomPrefix} {c.room}
                      {c.subcategory ? ` (${c.subcategory})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Active Filter Badge (visible when filtered and dropdown is hidden) */}
        {!showCubicleDropdown && (selectedCategory || selectedCubicleNum) && (
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
              className="ml-1 text-slate-400 hover:text-[#cc3535] cursor-pointer font-semibold underline text-[11px]"
              title={nurseTexts.clearFilter}
              aria-label={nurseTexts.clearFilter}
            >
              {nurseTexts.clearFilter}
            </button>
          </div>
        )}

        {/* Attending Physician Indicator */}
        {selectedCubicleNum && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs border border-purple-100">
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
          <span className="hidden sm:inline">{nurseTexts.stageFinishedHeading}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            {finishedCount}
          </span>
        </button>

        {/* Bottleneck Alerts & Notifications */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          showIcon={false}
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
