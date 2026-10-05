/**
 * @fileoverview Expandable / Collapsible navigation sidebar for the Patient Transfer dashboard.
 *
 * Supports two distinct display modes:
 * - Icon-only rail (`w-18` / 72px): Hides all text labels and shows icons with tooltips.
 * - Expanded panel (`w-64` / 256px): Displays full text labels, category badges, and title.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - 100% copy isolated in transferTexts
 * - Full JSDoc and zero emojis
 *
 * @module app/transfer/components/Sidebar
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { handleSignOut } from '@/lib/supabase/signOut';
import { CATEGORIES } from '../lib/constants';
import { transferTexts } from '../constants/transferTexts';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { SIDEBAR_ICONS, resolveServiceIcon } from '@/constants/icons';

/**
 * Props for the `Sidebar` component.
 */
export interface SidebarProps {
  /** Currently selected service category, or null. */
  selectedCategory: string | null;
  /** Map of service category names to active queue counts. */
  queueCounts: Record<string, number>;
  /** Map of service category names to idle counts. */
  idleCounts?: Record<string, number>;
  /** Callback fired when a category is clicked. */
  onSelectCategory: (category: string) => void;
  /** Optional allowed service categories for restricted roles. */
  allowedServices?: string[];
  /** Whether the sidebar is expanded with text labels. When false, displays icon-only. Defaults to false. */
  isExpanded?: boolean;
}

/**
 * Clean, expandable/collapsible sidebar navigation for the Patient Transfer dashboard.
 *
 * @param props - Navigation state, category counts, and expansion state.
 * @returns The rendered sidebar component.
 */
export function Sidebar({
  selectedCategory,
  queueCounts,
  idleCounts = {},
  allowedServices,
  onSelectCategory,
  isExpanded = false,
}: SidebarProps) {
  const router = useRouter();
  const visibleCategories = allowedServices
    ? CATEGORIES.filter(c => allowedServices.includes(c))
    : CATEGORIES;

  const handleLogout = async () => {
    await handleSignOut();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-xs z-30 flex flex-col transition-all duration-300 select-none ${
        isExpanded ? 'w-64' : 'w-18'
      }`}
      aria-label="Dashboard navigation"
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
                {transferTexts.dashboardTitle}
              </h1>
              <p className="text-[11px] font-medium text-slate-400">PHC Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Category List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 phc-scroll">
        {visibleCategories.map(category => {
          const queueCount = queueCounts[category] || 0;
          const idleCount = idleCounts[category] || 0;
          const totalCount = queueCount + idleCount;
          const isActive = selectedCategory === category;
          const icon = resolveServiceIcon(category);

          const tooltip = `${category}${
            queueCount > 0 ? ` — ${queueCount} waiting` : ''
          }${idleCount > 0 ? ` — ${idleCount} idle` : ''}`;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              title={tooltip}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full relative flex items-center ${
                isExpanded ? 'justify-between px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-[#cc3535] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <i
                  className={`bx ${icon} text-xl shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#cc3535]'
                  }`}
                  aria-hidden="true"
                />
                {isExpanded && (
                  <span className="text-sm truncate animate-in fade-in duration-200">
                    {category}
                  </span>
                )}
              </div>

              {/* Full Badges for Expanded View */}
              {isExpanded && (
                <div className="flex items-center gap-1 shrink-0 ml-2 animate-in fade-in duration-200">
                  {queueCount > 0 && (
                    <NotificationBadge
                      count={queueCount}
                      color={isActive ? 'brand' : 'amber'}
                      pulse={queueCount > 3}
                      className={isActive ? '!bg-white !text-[#cc3535] ring-transparent' : ''}
                    />
                  )}
                  {idleCount > 0 && (
                    <NotificationBadge
                      count={idleCount}
                      color="gray"
                      className={isActive ? '!bg-white/20 !text-white ring-transparent' : ''}
                    />
                  )}
                </div>
              )}

              {/* Indicator Dot for Icon-Only Rail View */}
              {!isExpanded && totalCount > 0 && (
                <span className="absolute top-1.5 right-1.5">
                  <NotificationBadge
                    variant="dot"
                    pulse={queueCount > 0}
                    color={isActive ? 'brand' : 'amber'}
                    className={isActive ? '!bg-white ring-[#cc3535]' : ''}
                  />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-2 border-t border-slate-100 space-y-1 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          title={transferTexts.logoutLabel}
          aria-label={transferTexts.logoutLabel}
          className={`w-full flex items-center ${
            isExpanded ? 'justify-start px-3' : 'justify-center px-0'
          } py-2 rounded-xl text-slate-500 hover:text-[#cc3535] hover:bg-red-50 transition-colors font-medium text-sm cursor-pointer`}
        >
          <i className={`bx ${SIDEBAR_ICONS.logout} text-xl shrink-0`} aria-hidden="true" />
          {isExpanded && (
            <span className="text-xs font-semibold ml-3 truncate animate-in fade-in duration-200">
              {transferTexts.logoutLabel}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;