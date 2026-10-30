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
import { useTheme } from 'next-themes';
import { toggleThemeWithRipple } from '@/lib/theme/themeTransition';
import NotificationDropdown from '@/app/dashboard/components/NotificationDropdown';
import { Notification } from '@/app/dashboard/hooks/useBottleneckNotifications';
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
  /** List of service categories assigned to the user or hospital. */
  assignedServices?: string[];
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
  notifications: Notification[];
  /** Unread notification count. */
  unreadCount: number;
  /** Notification handlers. */
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismissNotification: (id: string) => void;
  /** Callback to clear all active notifications. */
  onClearAllNotifications?: () => void;
  /** Optional explicitly claimed cubicle ID. */
  claimedCubicleId?: number | null;
  /** Callback fired to launch station configuration modal. */
  onOpenStationModal?: () => void;
  /** Opens the shared physician details and cubicle assignment editor. */
  onOpenDoctors?: () => void;
  /** Indicates that the explicit same-service OPD Screening view is active. */
  showAllScreening?: boolean;
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
  assignedServices = [],
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
  claimedCubicleId,
  onOpenStationModal,
  onOpenDoctors,
  showAllScreening = false,
}: NurseHeaderProps) {
  // Theme switching hook
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithRipple(e, () => {
      setTheme(isDark ? 'light' : 'dark');
    });
  };

  // Find attending physician if a single cubicle is selected
  const activeCubicle = selectedCubicleNum
    ? assignedCubicles.find((c) => c.cubicleNum === selectedCubicleNum)
    : null;

  const doctorName = activeCubicle?.doctorName;

  // Group cubicles by service category for desktop dropdown, including assigned services
  const services = useMemo(() => {
    const groups: Record<string, AssignedNurseCubicle[]> = {};
    (assignedServices || []).forEach((service) => {
      if (service) {
        groups[service] = [];
      }
    });
    assignedCubicles.forEach((cubicle) => {
      if (cubicle.category) {
        groups[cubicle.category] ??= [];
        groups[cubicle.category].push(cubicle);
      }
    });
    return groups;
  }, [assignedServices, assignedCubicles]);

  const claimedCubicle = claimedCubicleId
    ? assignedCubicles.find((c) => c.id === claimedCubicleId)
    : null;

  return (
    <header
      style={{ ...NurseStyle.headerBar, height: 'auto', minHeight: NurseStyle.headerBar.height, flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 1.5rem' }}
      className="bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-[#2e2e2e] transition-colors"
    >
      {/* Left: Sidebar Toggle, Station Title & Active Filters / Desktop Dropdown */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1 basis-[32rem]">
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

        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center text-[#cc3535]"><i className="bx bx-plus-medical text-xl" /></span>
          <div className="min-w-0">
            <p className="break-words whitespace-normal text-sm font-bold tracking-tight text-slate-900 dark:text-[#f5f5f5]">{nurseTexts.dashboardTitle}</p>
            <p className="hidden text-[11px] text-slate-500 dark:text-[#a3a3a3] xl:block">{nurseTexts.patientManagement}</p>
          </div>
        </div>

        {/* Active Station Badge & Switch Trigger */}
        {claimedCubicle ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] shrink-0">
            <span className="text-[11px] font-bold text-[#a8071a] dark:text-[#f87171] uppercase tracking-wider">
              Cubicle {claimedCubicle.cubicleNum}
            </span>
            {claimedCubicle.room && (
              <span className="text-[10px] text-slate-400 dark:text-[#737373] hidden sm:inline">
                (Room {claimedCubicle.room})
              </span>
            )}
            {assignedServices.length > 0 && (
              <span className="text-[10px] text-slate-400 dark:text-[#737373] hidden sm:inline">
                · {assignedServices.length} svc
              </span>
            )}
            {onOpenStationModal && (
              <button
                type="button"
                onClick={onOpenStationModal}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] transition underline cursor-pointer"
              >
                Switch
              </button>
            )}
          </div>
        ) : assignedCubicles.length > 1 ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] shrink-0">
            <span className="text-[11px] font-bold text-slate-700 dark:text-[#d4d4d4] uppercase tracking-wider">
              All Rooms ({assignedCubicles.length} Cubicles)
            </span>
            {onOpenStationModal && (
              <button
                type="button"
                onClick={onOpenStationModal}
                className="text-[11px] font-semibold text-[#a8071a] dark:text-[#f87171] hover:underline cursor-pointer"
              >
                Configure Desk
              </button>
            )}
          </div>
        ) : assignedCubicles.length === 1 ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] shrink-0">
            <span className="text-[11px] font-bold text-[#a8071a] dark:text-[#f87171] uppercase tracking-wider">
              Cubicle {assignedCubicles[0].cubicleNum}
            </span>
            {onOpenStationModal && (
              <button
                type="button"
                onClick={onOpenStationModal}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] transition underline cursor-pointer"
              >
                Switch
              </button>
            )}
          </div>
        ) : null}

        {/* Desktop Station / Cubicle Selector Dropdown */}
        {showCubicleDropdown && onSelectCategory && onSelectCubicle && (assignedCubicles.length > 0 || Object.keys(services).length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1f1f] dark:hover:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e] rounded-xl px-2.5 py-1 transition-colors min-w-0 max-w-full">
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
              aria-label={showAllScreening ? nurseTexts.screeningFilterLabel : nurseTexts.selectCubicleDropdown}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-[#f5f5f5] outline-none cursor-pointer py-0.5 pr-1 max-w-full whitespace-normal"
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
            <span className="font-bold text-slate-800 dark:text-[#f5f5f5] whitespace-normal break-words">
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
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs border border-purple-100 dark:border-purple-800/50 min-w-0 max-w-full">
            <span className="font-medium text-purple-600 dark:text-purple-400 shrink-0">{nurseTexts.doctorOnDuty}</span>
            <span className="font-bold whitespace-normal break-words">{doctorName || nurseTexts.noDoctorAssigned}</span>
          </div>
        )}
      </div>

      {/* Right: Sync Status, Finished Ledger Button, Theme Toggle & Notifications */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
        {/* Sync Indicator */}
        <div aria-hidden={!isSyncing} className={`flex shrink-0 items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg ${isSyncing ? 'visible' : 'invisible'}`}>
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              {nurseTexts.syncingBadge}
            </span>
          </div>

        {/* Finished Ledger Drawer Button */}
        {onOpenDoctors && <button type="button" onClick={onOpenDoctors}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a] dark:text-[#f5f5f5] dark:hover:bg-[#242424]">
          Doctors
        </button>}
        <button
          type="button"
          onClick={onOpenFinishedLedger}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#242424] text-slate-700 dark:text-[#f5f5f5] border border-slate-200 dark:border-[#2e2e2e] shadow-2xs transition-all cursor-pointer"
          title={nurseTexts.viewFinishedLedger}
        >
          <span className="hidden sm:inline">{nurseTexts.stageFinishedHeading}</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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
              className={`bx ${isDark
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
          onClearAll={onClearAllNotifications ?? (() => {})}
        />
      </div>
    </header>
  );
}

export default NurseHeader;
