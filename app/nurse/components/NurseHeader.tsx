/**
 * @fileoverview Fixed top header bar component for the Nurse Dashboard.
 *
 * Displays clinical navigation metadata, active room/cubicle filters, attending physician
 * indicators, synchronization state, finished ledger drawer triggers, and notification dropdown.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import NotificationDropdown from '@/app/dashboard/components/NotificationDropdown';
import { AssignedNurseCubicle } from '@/app/nurse/types/nurse';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { NurseStyle } from '@/app/nurse/constants/nurse';

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
  // Theme switching hook
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Find attending physician if a single cubicle is selected
  const activeCubicle = selectedCubicleNum
    ? assignedCubicles.find((c) => c.cubicleNum === selectedCubicleNum)
    : null;

  const doctorName = activeCubicle?.doctorName;

  // Group cubicles by service category for desktop dropdown
  const services = useMemo(
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
    <header
      style={NurseStyle.headerBar}
      className="bg-white/95 dark:bg-[#141414]/95 border-b border-slate-200 dark:border-[#2e2e2e] transition-colors"
    >
      {/* Left: Sidebar Toggle, Station Title & Active Filters / Desktop Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
        {/* Sidebar Hide/Open Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition-colors cursor-pointer shrink-0"
            title={isSidebarOpen ? nurseTexts.collapseSidebar : nurseTexts.expandSidebar}
            aria-label={isSidebarOpen ? nurseTexts.collapseSidebar : nurseTexts.expandSidebar}
          >
            <i
              className={`bx ${isSidebarOpen ? 'bx-chevron-left' : 'bx-menu'} text-xl block`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Return to Select Screen Button */}
        <Link
          href="/select-screen"
          className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition-colors cursor-pointer shrink-0"
          title={nurseTexts.selectScreenLabel}
          aria-label={nurseTexts.selectScreenAria}
        >
          <i className="bx bx-grid-alt text-xl block" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-600 dark:text-[#a3a3a3] text-sm font-semibold tracking-tight hidden md:inline truncate max-w-[170px] xl:max-w-none">
            {nurseTexts.patientManagement}
          </span>
        </div>

        {/* Desktop Station / Cubicle Selector Dropdown */}
        {showCubicleDropdown && onSelectCategory && onSelectCubicle && assignedCubicles.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/80 dark:bg-[#1f1f1f] dark:hover:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e] rounded-xl px-2.5 py-1 transition-colors min-w-0 shrink">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider shrink-0">
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
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-[#f5f5f5] outline-none cursor-pointer py-0.5 pr-1 max-w-[160px] lg:max-w-[200px] truncate"
            >
              <option value="ALL" className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-[#f5f5f5]">{nurseTexts.allMyCubicles}</option>
              {Object.entries(services).map(([service, cubicles]) => (
                <optgroup key={service} label={service} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-[#f5f5f5]">
                  <option value={`CAT:${service}`} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-[#f5f5f5]">
                    {service} ({nurseTexts.allShort})
                  </option>
                  {cubicles.map((c) => (
                    <option key={c.id} value={c.cubicleNum} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-[#f5f5f5]">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] text-xs text-slate-600 dark:text-[#a3a3a3] min-w-0 shrink">
            <span className="font-medium text-slate-400 dark:text-[#737373] shrink-0">
              {nurseTexts.filteredByPrefix}
            </span>
            <span className="font-bold text-slate-800 dark:text-[#f5f5f5] truncate max-w-[120px]">
              {selectedCubicleNum
                ? `${nurseTexts.cubiclePrefix} ${selectedCubicleNum}`
                : selectedCategory}
            </span>
            <button
              type="button"
              onClick={onClearFilter}
              className="ml-1 text-slate-400 hover:text-[#cc3535] dark:text-[#737373] dark:hover:text-[#f87171] cursor-pointer font-semibold underline text-[11px] shrink-0"
              title={nurseTexts.clearFilter}
              aria-label={nurseTexts.clearFilter}
            >
              {nurseTexts.clearFilter}
            </button>
          </div>
        )}

        {/* Attending Physician Indicator */}
        {selectedCubicleNum && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs border border-purple-100 dark:border-purple-800/50 min-w-0 shrink max-w-[220px]">
            <span className="font-medium text-purple-600 dark:text-purple-400 shrink-0">{nurseTexts.doctorOnDuty}</span>
            <span className="font-bold truncate">{doctorName || nurseTexts.noDoctorAssigned}</span>
          </div>
        )}
      </div>

      {/* Right: Sync Status, Finished Ledger Button, Theme Toggle & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        {/* Sync Indicator */}
        {isSyncing ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              {nurseTexts.syncingBadge}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              {nurseTexts.liveStatus}
            </span>
          </div>
        )}

        {/* Finished Ledger Drawer Button */}
        <button
          type="button"
          onClick={onOpenFinishedLedger}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#242424] text-slate-700 dark:text-[#f5f5f5] border border-slate-200 dark:border-[#2e2e2e] shadow-2xs transition-all cursor-pointer"
          title={nurseTexts.viewFinishedLedger}
        >
          <span className="hidden sm:inline">{nurseTexts.stageFinishedHeading}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
            {finishedCount}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition-colors cursor-pointer shrink-0"
          title={isDark ? nurseTexts.themeToggleLight : nurseTexts.themeToggleDark}
          aria-label={isDark ? nurseTexts.themeToggleLight : nurseTexts.themeToggleDark}
        >
          {mounted ? (
            <i
              className={`bx ${
                isDark
                  ? 'bx-sun text-amber-400'
                  : 'bx-moon text-slate-600 dark:text-[#a3a3a3]'
              } text-xl block`}
              aria-hidden="true"
            />
          ) : (
            <div className="w-5 h-5" />
          )}
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
