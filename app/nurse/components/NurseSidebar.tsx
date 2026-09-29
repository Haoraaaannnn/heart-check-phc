/**
 * @fileoverview Expandable / Collapsible navigation sidebar rail for the Nurse Dashboard.
 *
 * Supports two distinct display modes:
 * - Icon-only rail (`w-18` / 72px): Hides text labels, maximizing screen area for the 3-column clinical Kanban board.
 * - Expanded panel (`w-64` / 256px): Displays full text labels, patient count badges, and room/cubicle hierarchies.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - 100% copy isolated in nurseTexts
 * - Full JSDoc and zero emojis
 *
 * @module app/nurse/components/NurseSidebar
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AssignedNurseCubicle } from '../types/nurse';
import { nurseTexts } from '../constants/nurseTexts';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { SIDEBAR_ICONS, resolveServiceIcon } from '@/constants/icons';

/**
 * Props for the NurseSidebar component.
 */
export interface NurseSidebarProps {
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
  /** Whether the sidebar is expanded with text labels. When false, displays icon-only. Defaults to false. */
  isExpanded?: boolean;
}

/**
 * Clean, expandable/collapsible sidebar navigation for the Nurse Dashboard.
 *
 * @param props - Filter states, counts, and expansion state.
 * @returns The rendered sidebar component.
 */
export function NurseSidebar({
  selectedCategory,
  selectedCubicleNum,
  categoryCounts,
  assignedCubicles,
  onSelectCategory,
  onSelectCubicle,
  isExpanded = false,
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
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-xs z-30 flex flex-col transition-all duration-300 select-none ${
        isExpanded ? 'w-64' : 'w-18'
      }`}
      aria-label="Nurse Station navigation"
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 shrink-0 transition-all duration-300 ${
          isExpanded ? 'px-4' : 'justify-center px-2'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#cc3535] text-white flex items-center justify-center text-lg shadow-xs shrink-0">
            <i className={`bx ${SIDEBAR_ICONS.brandSolid}`} aria-hidden="true" />
          </div>
          {isExpanded && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <h1 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                {nurseTexts.dashboardTitle}
              </h1>
              <p className="text-[11px] font-medium text-slate-400">PHC Clinical</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 phc-scroll">
        {/* All Cubicles Reset Button */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          title={`${nurseTexts.allMyCubicles}${totalPatients > 0 ? ` — ${totalPatients} active` : ''}`}
          aria-current={!selectedCategory && !selectedCubicleNum ? 'page' : undefined}
          className={`w-full relative flex items-center ${
            isExpanded ? 'justify-between px-3' : 'justify-center px-0'
          } py-2.5 rounded-xl transition-all duration-150 group cursor-pointer ${
            !selectedCategory && !selectedCubicleNum
              ? 'bg-[#cc3535] text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <i
              className={`bx ${SIDEBAR_ICONS.allCubicles} text-xl shrink-0 ${
                !selectedCategory && !selectedCubicleNum
                  ? 'text-white'
                  : 'text-slate-400 group-hover:text-[#cc3535]'
              }`}
              aria-hidden="true"
            />
            {isExpanded && (
              <span className="text-sm truncate animate-in fade-in duration-200">
                {nurseTexts.allMyCubicles}
              </span>
            )}
          </div>

          {/* Full Badge for Expanded View */}
          {isExpanded && totalPatients > 0 && (
            <div className="hidden 2xl:flex items-center shrink-0 ml-2 animate-in fade-in duration-200">
              <NotificationBadge
                count={totalPatients}
                color={!selectedCategory && !selectedCubicleNum ? 'brand' : 'gray'}
                className={
                  !selectedCategory && !selectedCubicleNum
                    ? '!bg-white !text-[#cc3535] ring-transparent'
                    : ''
                }
              />
            </div>
          )}

          {/* Indicator Dot for Icon-Only Rail View */}
          {!isExpanded && totalPatients > 0 && (
            <span className="absolute top-1.5 right-1.5">
              <NotificationBadge
                variant="dot"
                color={!selectedCategory && !selectedCubicleNum ? 'brand' : 'gray'}
                className={
                  !selectedCategory && !selectedCubicleNum
                    ? '!bg-white ring-[#cc3535]'
                    : ''
                }
              />
            </span>
          )}
        </button>

        {isExpanded && (
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 animate-in fade-in duration-200">
            {nurseTexts.myCoverage}
          </p>
        )}

        {/* Grouped Service Categories & Cubicles */}
        <div className="space-y-1 pt-1">
          {Object.entries(services).map(([service, cubicles]) => {
            const count = categoryCounts[service] || 0;
            const isCategoryActive = selectedCategory === service && !selectedCubicleNum;
            const isServiceSelected = selectedCategory === service;
            const icon = resolveServiceIcon(service);
            const tooltip = `${service}${count > 0 ? ` — ${count} active` : ''}`;

            return (
              <div key={service} className="space-y-1">
                <button
                  type="button"
                  onClick={() => onSelectCategory(service)}
                  title={tooltip}
                  aria-current={isCategoryActive ? 'page' : undefined}
                  className={`w-full relative flex items-center ${
                    isExpanded ? 'justify-between px-3' : 'justify-center px-0'
                  } py-2.5 rounded-xl transition-all duration-150 group cursor-pointer ${
                    isCategoryActive
                      ? 'bg-[#cc3535] text-white shadow-xs font-semibold'
                      : isServiceSelected
                      ? 'bg-red-50/80 text-[#cc3535] font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <i
                      className={`bx ${icon} text-xl shrink-0 ${
                        isCategoryActive
                          ? 'text-white'
                          : isServiceSelected
                          ? 'text-[#cc3535]'
                          : 'text-slate-400 group-hover:text-[#cc3535]'
                      }`}
                      aria-hidden="true"
                    />
                    {isExpanded && (
                      <span className="text-sm truncate animate-in fade-in duration-200">
                        {service}
                      </span>
                    )}
                  </div>

                  {/* Full Badge for Expanded View */}
                  {isExpanded && count > 0 && (
                    <div className="flex items-center shrink-0 ml-2 animate-in fade-in duration-200">
                      <NotificationBadge
                        count={count}
                        color={isCategoryActive ? 'brand' : 'gray'}
                        pulse={count > 3}
                        className={
                          isCategoryActive
                            ? '!bg-white !text-[#cc3535] ring-transparent'
                            : ''
                        }
                      />
                    </div>
                  )}

                  {/* Indicator Dot for Icon-Only Rail View */}
                  {!isExpanded && count > 0 && (
                    <span className="absolute top-1.5 right-1.5">
                      <NotificationBadge
                        variant="dot"
                        pulse={count > 3}
                        color={isCategoryActive ? 'brand' : 'gray'}
                        className={isCategoryActive ? '!bg-white ring-[#cc3535]' : ''}
                      />
                    </span>
                  )}
                </button>

                {/* Expanded Cubicles under active service */}
                {isExpanded && isServiceSelected && cubicles.length > 0 && (
                  <div className="ml-5 space-y-1 border-l-2 border-slate-200 pl-2.5 pt-1 animate-in fade-in duration-200">
                    {cubicles.map((cubicle) => {
                      const active = selectedCubicleNum === cubicle.cubicleNum;

                      return (
                        <button
                          key={cubicle.id}
                          type="button"
                          onClick={() => onSelectCubicle(cubicle.cubicleNum)}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-left transition cursor-pointer ${
                            active
                              ? 'bg-[#cc3535] text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <p className="text-xs font-bold leading-tight">
                            {nurseTexts.cubiclePrefix} {cubicle.cubicleNum}
                          </p>
                          <p
                            className={`text-[10px] leading-tight ${
                              active ? 'text-white/80' : 'text-slate-400'
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

      {/* Footer / Logout */}
      <div className="p-2 border-t border-slate-100 space-y-1 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          title={nurseTexts.logoutLabel}
          aria-label={nurseTexts.logoutLabel}
          className={`w-full flex items-center ${
            isExpanded ? 'justify-start px-3' : 'justify-center px-0'
          } py-2 rounded-xl text-slate-500 hover:text-[#cc3535] hover:bg-red-50 transition-colors font-medium text-sm cursor-pointer`}
        >
          <i className={`bx ${SIDEBAR_ICONS.logout} text-xl shrink-0`} aria-hidden="true" />
          {isExpanded && (
            <span className="text-xs font-semibold ml-3 truncate animate-in fade-in duration-200">
              {nurseTexts.logoutLabel}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default NurseSidebar;
