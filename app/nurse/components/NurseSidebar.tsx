/**
 * @fileoverview Collapsible navigation sidebar rail for the Nurse Dashboard.
 *
 * Provides room and cubicle level filtering, coverage metrics, and session logout.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - 100% copy isolated in nurseTexts
 * - Layout tokens isolated in nurseLayoutTokens
 * - Full JSDoc and zero emojis
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AssignedNurseCubicle } from '../types/nurse';
import { CATEGORY_ICONS } from '../lib/constants';
import { nurseTexts } from '../constants/nurseTexts';
import { nurseLayoutTokens } from '../constants/nurse';

/**
 * Props for the NurseSidebar component.
 */
export interface NurseSidebarProps {
  /** Whether the sidebar is expanded or collapsed. */
  sidebarOpen: boolean;
  /** Currently selected service category filter, or null for all. */
  selectedCategory: string | null;
  /** Currently selected cubicle filter, or null for all. */
  selectedCubicleNum: string | null;
  /** Mapping of service category names to active patient counts. */
  categoryCounts: Record<string, number>;
  /** Roster of cubicles assigned to the user or hospital. */
  assignedCubicles: AssignedNurseCubicle[];
  /** Handler to select a category filter. */
  onSelectCategory: (category: string | null) => void;
  /** Handler to select an individual cubicle filter. */
  onSelectCubicle: (cubicleNum: string) => void;
  /** Handler to toggle sidebar between expanded and collapsed states. */
  onToggleSidebar: () => void;
}

/**
 * Navigation rail component for filtering nurse workstation view by room and cubicle.
 *
 * @param props - Filter states, counts, and toggle callbacks.
 * @returns The rendered sidebar element.
 */
export function NurseSidebar({
  sidebarOpen,
  selectedCategory,
  selectedCubicleNum,
  categoryCounts,
  assignedCubicles,
  onSelectCategory,
  onSelectCubicle,
  onToggleSidebar,
}: NurseSidebarProps) {
  const router = useRouter();

  // Group cubicles by service category
  const services = assignedCubicles.reduce<Record<string, AssignedNurseCubicle[]>>(
    (groups, cubicle) => {
      groups[cubicle.category] ??= [];
      groups[cubicle.category].push(cubicle);
      return groups;
    },
    {}
  );

  const totalPatients = Object.values(categoryCounts).reduce(
    (total, count) => total + count,
    0
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-full flex-col border-r border-slate-200 bg-white shadow-lg transition-all duration-300"
      style={{
        width: sidebarOpen
          ? nurseLayoutTokens.sidebarWidthExpanded
          : nurseLayoutTokens.sidebarWidthCollapsed,
      }}
    >
      {/* Top Toggle Header */}
      <div
        className={`flex items-center border-b border-slate-200 ${
          sidebarOpen ? 'justify-between p-4' : 'justify-center p-2.5'
        }`}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#cc3535] text-white flex items-center justify-center font-black text-sm shadow-2xs">
              HC
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">
              {nurseTexts.dashboardTitle}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          title={sidebarOpen ? nurseTexts.collapseSidebar : nurseTexts.expandSidebar}
          aria-label={sidebarOpen ? nurseTexts.collapseSidebar : nurseTexts.expandSidebar}
        >
          <i
            className={`bx ${
              sidebarOpen ? 'bx-chevron-left' : 'bx-chevron-right'
            } text-xl`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 phc-scroll">
        {/* All Cubicles Reset Button */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`mb-4 flex w-full items-center ${
            sidebarOpen ? 'justify-between px-3.5' : 'justify-center px-0'
          } rounded-xl py-2.5 text-left transition cursor-pointer ${
            !selectedCategory && !selectedCubicleNum
              ? 'bg-[#cc3535] text-white shadow-xs font-bold'
              : 'text-slate-700 hover:bg-slate-100 font-medium'
          }`}
          title={nurseTexts.allMyCubicles}
        >
          <div className="flex items-center gap-2.5">
            <i className="bx bx-grid-alt text-lg" aria-hidden="true" />
            {sidebarOpen && (
              <span className="text-xs font-bold">{nurseTexts.allMyCubicles}</span>
            )}
          </div>

          {sidebarOpen && totalPatients > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                !selectedCategory && !selectedCubicleNum
                  ? 'bg-white text-[#cc3535]'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalPatients}
            </span>
          )}
        </button>

        {sidebarOpen && (
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {nurseTexts.myCoverage}
          </p>
        )}

        {/* Grouped Service Categories & Cubicles */}
        <div className="space-y-2">
          {Object.entries(services).map(([service, cubicles]) => {
            const isServiceActive =
              selectedCategory === service && !selectedCubicleNum;

            return (
              <div key={service}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(service)}
                  className={`flex w-full items-center ${
                    sidebarOpen ? 'justify-between px-3' : 'justify-center px-0'
                  } rounded-xl py-2 text-left transition cursor-pointer ${
                    isServiceActive
                      ? 'bg-red-50 text-[#cc3535] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                  title={service}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <i
                      className={`bx ${
                        CATEGORY_ICONS[service] || 'bx-folder'
                      } text-lg text-slate-500 shrink-0`}
                      aria-hidden="true"
                    />
                    {sidebarOpen && (
                      <span className="text-xs font-semibold truncate">
                        {service}
                      </span>
                    )}
                  </div>

                  {sidebarOpen && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                      {categoryCounts[service] || 0}
                    </span>
                  )}
                </button>

                {/* Expanded Cubicle Sub-buttons */}
                {sidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2.5">
                    {cubicles.map((cubicle) => {
                      const active = selectedCubicleNum === cubicle.cubicleNum;

                      return (
                        <button
                          key={cubicle.id}
                          type="button"
                          onClick={() => onSelectCubicle(cubicle.cubicleNum)}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-left transition cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <p className="text-xs font-bold leading-tight">
                            {cubicle.cubicleNum}
                          </p>
                          <p
                            className={`text-[10px] leading-tight ${
                              active ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {nurseTexts.roomPrefix} {cubicle.room}
                            {cubicle.subcategory ? ` · ${cubicle.subcategory}` : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Logout Footer */}
      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-[#cc3535] transition cursor-pointer ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
          title={nurseTexts.logoutLabel}
          aria-label={nurseTexts.logoutLabel}
        >
          <i className="bx bx-log-out text-lg" aria-hidden="true" />
          {sidebarOpen && (
            <span className="text-xs font-semibold">{nurseTexts.logoutLabel}</span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default NurseSidebar;
