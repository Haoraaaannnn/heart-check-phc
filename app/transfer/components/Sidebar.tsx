/**
 * @fileoverview Expandable / Collapsible navigation sidebar for the Patient Transfer dashboard.
 *
 * Supports two distinct display modes:
 * - Icon-only rail (`w-18` / 72px): Hides all text labels and shows icons with tooltips.
 * - Expanded panel (`w-64` / 256px): Displays full text labels, category badges, and title.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/Sidebar
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AccountSettingsButton } from '@/components/auth/AccountSettingsButton';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { handleSignOut } from '@/lib/supabase/signOut';
import { CATEGORIES } from '@/app/transfer/lib/constants';
import { transferTexts } from '@/constants/texts/transferTexts';
import { sidebarStyles } from '@/constants/designs/transferStyles';
import { NotificationBadge } from '@/components/reusables/NotificationBadge';
import { BrandLogo } from '@/components/reusables/BrandLogo';
import { SIDEBAR_ICONS, resolveServiceIcon } from '@/constants/icons';
import type { Service } from '@/types/Services';

/**
 * Props for the `Sidebar` component.
 */
export interface SidebarProps {
  /** Currently selected service category, or null. */
  selectedCategory: string | null;
  /** Map of service category names to active queue counts. */
  queueCounts: Record<string, number>;
  /** Callback fired when a category is clicked. */
  onSelectCategory: (category: string) => void;
  /** Optional allowed service categories for restricted roles. */
  allowedServices?: string[];
  /** Optional full clinical services catalog from parent. */
  services?: Service[];
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
  allowedServices,
  services,
  onSelectCategory,
  isExpanded = false,
}: SidebarProps) {
  const router = useRouter();
  const [dbServices, setDbServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = () => {
      supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setDbServices(data as Service[]);
          }
        });
    };

    fetchServices();

    const channel = supabase
      .channel('transfer-sidebar-services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const catalogServices = (services && services.length > 0) ? services : dbServices;
  const defaultCategories = catalogServices.length > 0
    ? catalogServices.map(s => s.label_en)
    : CATEGORIES;
  const visibleCategories = (allowedServices && allowedServices.length > 0)
    ? allowedServices
    : defaultCategories;

  const serviceMap = useMemo(() => {
    const map = new Map<string, Service>();
    catalogServices.forEach(s => {
      if (s.label_en) {
        map.set(s.label_en.trim().toLowerCase(), s);
      }
    });
    return map;
  }, [catalogServices]);

  const handleLogout = async () => {
    await handleSignOut();
  };

  return (
    <aside
      className={sidebarStyles.rail(isExpanded)}
      aria-label="Dashboard navigation"
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 dark:border-[#2e2e2e] shrink-0 transition-all duration-300 ${
          isExpanded ? 'px-4' : 'justify-center px-2'
        }`}
      >
        {isExpanded ? (
          <div className="min-w-0 animate-in fade-in duration-200">
            <BrandLogo variant="full" className="h-11 w-auto max-w-[190px]" />
          </div>
        ) : (
          <BrandLogo variant="icon" className="h-10 w-auto" />
        )}
      </div>

      {/* Category List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 phc-scroll">
        {visibleCategories.map(category => {
          const queueCount = queueCounts[category] || 0;
          const totalCount = queueCount;
          const isActive = selectedCategory === category;
          const serviceObj = serviceMap.get(category.trim().toLowerCase());
          const icon = resolveServiceIcon(
            serviceObj ? { label_en: category, icon_src: serviceObj.icon_src } : category
          );

          const tooltip = `${category}${
            queueCount > 0 ? ` — ${queueCount} waiting` : ''
          }`;

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
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#d4d4d4] dark:hover:bg-[#242424] dark:hover:text-[#ffffff] font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <i
                  className={`bx ${icon} text-xl shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#cc3535] dark:text-[#a3a3a3] dark:group-hover:text-[#f87171]'
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
                      className={isActive ? '!text-white' : ''}
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

      {/* Footer / Workstation Controls */}
      <div className="p-2 border-t border-slate-100 dark:border-[#2e2e2e] space-y-1 shrink-0">
        <AccountSettingsButton sidebar expanded={isExpanded} />
        {/* Return to Select Screen */}
        <button
          type="button"
          onClick={() => router.push('/select-screen')}
          title={transferTexts.selectScreenLabel}
          aria-label={transferTexts.selectScreenAria}
          className={`w-full flex items-center ${
            isExpanded ? 'justify-start px-3' : 'justify-center px-0'
          } py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-[#d4d4d4] dark:hover:text-[#ffffff] dark:hover:bg-[#242424] transition-colors font-medium text-sm cursor-pointer`}
        >
          <i className={`bx ${SIDEBAR_ICONS.selectScreen} text-xl shrink-0 text-slate-400 dark:text-[#a3a3a3]`} aria-hidden="true" />
          {isExpanded && (
            <span className="text-xs font-semibold ml-3 truncate animate-in fade-in duration-200">
              {transferTexts.selectScreenLabel}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title={transferTexts.logoutLabel}
          aria-label={transferTexts.logoutLabel}
          className={`w-full flex items-center ${
            isExpanded ? 'justify-start px-3' : 'justify-center px-0'
          } py-2 rounded-xl text-slate-500 hover:text-[#cc3535] hover:bg-red-50 dark:text-[#d4d4d4] dark:hover:text-[#f87171] dark:hover:bg-red-950/30 transition-colors font-medium text-sm cursor-pointer`}
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
