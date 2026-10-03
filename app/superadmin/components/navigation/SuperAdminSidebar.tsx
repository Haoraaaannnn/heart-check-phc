/**
 * @fileoverview Enterprise Sidebar navigation component for the SuperAdmin portal.
 *
 * Implements industry-standard left rail navigation grouped by Access & Identity,
 * Clinical Infrastructure, Patient Touchscreen, and System Governance.
 *
 * @module app/superadmin/components/navigation/SuperAdminSidebar
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  SUPERADMIN_NAV_GROUPS,
  SuperadminNavLink,
} from '../../constants/superadminNav';
import { SUPERADMIN_TEXTS } from '../../constants/superadminTexts';
import { SUPERADMIN_NAV_STYLES } from '../../constants/superadminNavStyles';

interface SuperAdminSidebarProps {
  /** Optional callback when a navigation link is clicked (used to close mobile drawer). */
  onNavigate?: () => void;
  /** Whether rendering inside a mobile slide-over drawer instead of desktop rail. */
  isMobileDrawer?: boolean;
}

/**
 * SuperAdmin enterprise sidebar component.
 *
 * @param props - Component properties.
 * @returns JSX element containing the navigation sidebar.
 */
export function SuperAdminSidebar({
  onNavigate,
  isMobileDrawer = false,
}: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const S = SUPERADMIN_NAV_STYLES.sidebar;
  const T = SUPERADMIN_TEXTS.navigation;

  /**
   * Determines whether a navigation link matches the current path and query parameter.
   */
  const isLinkActive = (item: SuperadminNavLink): boolean => {
    if (item.matchPrefix === '/superadmin') {
      if (pathname !== '/superadmin') return false;
      if (item.matchTab) {
        return activeTab === item.matchTab;
      }
      return activeTab === 'users';
    }

    if (item.matchPrefix === '/superadmin/facilities') {
      if (!pathname.startsWith('/superadmin/facilities')) return false;
      if (item.matchTab) {
        const facilitiesTab = searchParams.get('tab') || 'rooms';
        return facilitiesTab === item.matchTab;
      }
      return true;
    }

    if (item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix);
    }

    return pathname === item.href;
  };

  const content = (
    <>
      {/* Brand Header */}
      <div className={S.brandHeader}>
        <div className={S.brandBadge}>PHC</div>
        <div>
          <div className={S.brandTitle}>{T.portalBrand}</div>
          <div className={S.brandSubtitle}>{T.portalSub}</div>
        </div>
      </div>

      {/* Nav Groups Scroll Area */}
      <div className={S.navScrollArea}>
        {SUPERADMIN_NAV_GROUPS.map((group) => (
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
          <span>{T.systemStatus}</span>
        </div>
        <div className={S.footerText}>{T.systemFooter}</div>
      </div>
    </>
  );

  if (isMobileDrawer) {
    return <div className="h-full flex flex-col justify-between">{content}</div>;
  }

  return <aside className={S.root}>{content}</aside>;
}
