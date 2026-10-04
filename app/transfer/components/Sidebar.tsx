'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CATEGORY_ICONS } from '../lib/constants';
import { transferTexts } from '../constants/transferTexts';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';

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
}

/**
 * Clean, fixed-width sidebar navigation for the Patient Transfer dashboard.
 *
 * @remarks
 * In accordance with redesign specifications:
 * - Auto-hide and toggle collapse buttons have been eliminated.
 * - Displays as an icon rail on screens below `2xl`, expanding to a full 64-width panel on `2xl+`.
 * - Employs accessible tooltips and NotificationBadges for real-time queue visibility.
 *
 * @param props - Navigation state and category counts.
 * @returns The rendered sidebar component.
 */
export function Sidebar({
  selectedCategory,
  queueCounts,
  idleCounts = {},
  allowedServices,
  onSelectCategory,
}: SidebarProps) {
  const router = useRouter();
  const visibleCategories = allowedServices
    ? CATEGORIES.filter(c => allowedServices.includes(c))
    : CATEGORIES;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-xs z-30 flex flex-col w-18 2xl:w-64 transition-all duration-200 select-none"
      aria-label="Dashboard navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-center 2xl:justify-start px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#cc3535] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
            <i className="bx bxs-heart" aria-hidden="true" />
          </div>
          <div className="hidden 2xl:block min-w-0">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight truncate">
              {transferTexts.dashboardTitle}
            </h1>
            <p className="text-[11px] font-medium text-slate-400">PHC Management</p>
          </div>
        </div>
      </div>

      {/* Category List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 phc-scroll">
        {visibleCategories.map(category => {
          const queueCount = queueCounts[category] || 0;
          const idleCount = idleCounts[category] || 0;
          const totalCount = queueCount + idleCount;
          const isActive = selectedCategory === category;
          const icon = CATEGORY_ICONS[category] || 'bx-folder';

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
              className={`w-full relative flex items-center justify-center 2xl:justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer ${
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
                <span className="hidden 2xl:inline text-sm truncate">{category}</span>
              </div>

              {/* Badges for 2xl+ */}
              <div className="hidden 2xl:flex items-center gap-1 shrink-0 ml-2">
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

              {/* Indicator Dot for rail view (< 2xl) */}
              {totalCount > 0 && (
                <span className="2xl:hidden absolute top-1.5 right-1.5">
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
      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          title={transferTexts.logoutLabel}
          className="w-full flex items-center justify-center 2xl:justify-start gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-[#cc3535] hover:bg-red-50 transition-colors font-medium text-sm cursor-pointer"
        >
          <i className="bx bx-log-out text-xl shrink-0" aria-hidden="true" />
          <span className="hidden 2xl:inline truncate">{transferTexts.logoutLabel}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;