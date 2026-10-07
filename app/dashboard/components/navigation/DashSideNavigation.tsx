/**
 * @fileoverview Enterprise Sidebar navigation component for the Admin Dashboard.
 *
 * Implements an industry-standard left rail navigation grouped by Overview & Monitoring,
 * Queue Operations, Clinical Services, and Intelligence & Reports. Supports both desktop
 * fixed rail and responsive mobile slide-over drawer modes.
 *
 * @module app/dashboard/components/navigation/DashSideNavigation
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import 'boxicons/css/boxicons.min.css';
import {
  DASHBOARD_NAV_GROUPS,
  DashboardNavLink,
} from '@/app/dashboard/constants/navigation';
import { DASHBOARD_NAV_TEXTS } from '@/app/dashboard/constants/dashNavTexts';
import { DASH } from '@/app/dashboard/constants/styles';

/**
 * Properties for the DashSideNavigation component.
 */
export interface DashSideNavigationProps {
  /** Optional callback invoked when a link is clicked, used to close mobile drawers. */
  onNavigate?: () => void;
  /** Whether rendering inside a mobile slide-over drawer instead of the desktop rail. */
  isMobileDrawer?: boolean;
}

/**
 * Enterprise left-rail navigation sidebar for the Admin Dashboard.
 *
 * @param props - Component configuration properties.
 * @returns JSX element containing the complete navigation rail.
 */
export function DashSideNavigation({
  onNavigate,
  isMobileDrawer = false,
}: DashSideNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const S = DASH.sidebar;
  const T = DASHBOARD_NAV_TEXTS;

  /**
   * Evaluates whether a navigation link matches the current path and query parameters.
   *
   * @param item - Navigation link contract to test.
   * @returns True if the navigation link represents the active page/tab.
   */
  const isLinkActive = (item: DashboardNavLink): boolean => {
    // Exact dashboard home matching
    if (item.matchPrefix === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }

    // Cubicles route matching (canonical and legacy forwarding)
    if (item.matchPrefix === '/dashboard/pages/cubicles') {
      return (
        pathname.startsWith('/dashboard/pages/cubicles') ||
        pathname.startsWith('/dashboard/cubicles')
      );
    }

    // Analytics route matching (canonical and legacy forwarding)
    if (item.matchPrefix === '/dashboard/pages/analytics') {
      return (
        pathname.startsWith('/dashboard/pages/analytics') ||
        pathname.startsWith('/dashboard/analytics')
      );
    }

    // Import route matching
    if (item.matchPrefix === '/dashboard/pages/import') {
      return (
        pathname.startsWith('/dashboard/pages/import') ||
        pathname.startsWith('/dashboard/import')
      );
    }

    // Export route matching
    if (item.matchPrefix === '/dashboard/pages/export') {
      return (
        pathname.startsWith('/dashboard/pages/export') ||
        pathname.startsWith('/dashboard/export')
      );
    }

    // Patients and clinical services matching
    if (
      pathname.startsWith('/dashboard/pages/patients') ||
      pathname.startsWith('/dashboard/patients')
    ) {
      if (item.matchQueryParam) {
        return (
          searchParams.get(item.matchQueryParam.key) ===
          item.matchQueryParam.value
        );
      }
      // General patients page is only active when no specific service is selected
      if (item.matchPrefix === '/dashboard/pages/patients') {
        return !searchParams.get('service');
      }
    }

    if (item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix);
    }

    return pathname === item.href;
  };

  const navContent = (
    <>
      {/* Brand Header */}
      <div className={S.brandHeader}>
        <div className={S.brandBadge}>{T.brand.badge}</div>
        <div>
          <div className={S.brandTitle}>{T.brand.title}</div>
          <div className={S.brandSubtitle}>{T.brand.subtitle}</div>
        </div>
      </div>

      {/* Nav Groups Scroll Area */}
      <div className={S.navScrollArea}>
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <div key={group.key} className={S.groupSection}>
            <div className={S.groupTitle}>{group.title}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isLinkActive(item);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onNavigate}
                    className={`${S.navLink} ${
                      active ? S.navLinkActive : S.navLinkIdle
                    }`}
                  >
                    <i
                      className={`bx ${item.icon} ${S.navIcon} ${
                        active ? S.navIconActive : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className={S.footer}>
        <div className={S.statusBadge}>
          <span className={S.statusDot} />
          <span>{T.system.statusOnline}</span>
        </div>
        <div className={S.footerText}>{T.system.footerAttribution}</div>
      </div>
    </>
  );

  if (isMobileDrawer) {
    return <div className="h-full flex flex-col justify-between">{navContent}</div>;
  }

  return <aside className={S.root}>{navContent}</aside>;
}

export default DashSideNavigation;