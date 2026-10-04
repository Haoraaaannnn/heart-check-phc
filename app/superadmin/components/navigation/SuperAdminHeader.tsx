/**
 * @fileoverview Top header bar component for the enterprise SuperAdmin portal.
 *
 * Renders breadcrumb navigation, live Manila-time clock, light/dark theme toggle,
 * user identity pill, mobile drawer trigger, and sign-out controls.
 *
 * @module app/superadmin/components/navigation/SuperAdminHeader
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';
import { SUPERADMIN_TEXTS } from '../../constants/superadminTexts';
import { SUPERADMIN_NAV_STYLES } from '../../constants/superadminNavStyles';

interface SuperAdminHeaderProps {
  /** Handler to open the mobile drawer. */
  onOpenMobileDrawer: () => void;
}

/**
 * SuperAdmin enterprise header bar.
 *
 * @param props - Component properties.
 * @returns JSX element containing the top header.
 */
export function SuperAdminHeader({ onOpenMobileDrawer }: SuperAdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [userEmail, setUserEmail] = useState('');
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();

  const S = SUPERADMIN_NAV_STYLES.header;
  const T = SUPERADMIN_TEXTS.navigation;

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  /**
   * Computes dynamic breadcrumb labels according to current route and tab.
   */
  const getBreadcrumb = (): { section: string; page: string } => {
    const tab = searchParams.get('tab');

    if (pathname.startsWith('/superadmin/facilities')) {
      return {
        section: T.groupFacilities,
        page: tab === 'counters' ? T.navCounters : T.navRooms,
      };
    }

    if (pathname.startsWith('/superadmin/customization')) {
      return {
        section: T.groupKiosk,
        page: T.navKioskServices,
      };
    }

    if (tab === 'settings') {
      return {
        section: T.groupGovernance,
        page: T.navAutomation,
      };
    }

    if (tab === 'security') {
      return {
        section: T.groupGovernance,
        page: T.navSecurity,
      };
    }

    return {
      section: T.groupAccess,
      page: T.navStaffAccounts,
    };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className={S.root}>
      {/* Left: Hamburger & Breadcrumbs */}
      <div className={S.leftGroup}>
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className={S.hamburgerButton}
          aria-label={T.toggleSidebar}
        >
          <i className="bx bx-menu text-2xl" aria-hidden="true" />
        </button>

        <div className={S.breadcrumbs}>
          <span className="font-semibold text-slate-400 dark:text-[#737373]">
            SuperAdmin
          </span>
          <span className={S.breadcrumbSeparator}>/</span>
          <span>{breadcrumb.section}</span>
          <span className={S.breadcrumbSeparator}>/</span>
          <span className={S.breadcrumbActive}>{breadcrumb.page}</span>
        </div>
      </div>

      {/* Right: Clock, Theme, User Chip & Sign Out */}
      <div className={S.rightGroup}>
        {/* Live Manila Clock */}
        <div className={S.clockContainer}>
          <span className={S.clockDate}>
            {now ? formatManilaDate(now) : '--'}
          </span>
          <span className={S.clockTime}>
            {now ? formatManilaTime(now, true) : '--:--:--'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={S.themeButton}
          title={isDark ? T.themeToggleLight : T.themeToggleDark}
          aria-label={isDark ? T.themeToggleLight : T.themeToggleDark}
        >
          {mounted ? (
            <i
              className={`bx ${
                isDark
                  ? 'bx-sun text-amber-400'
                  : 'bx-moon text-slate-600 dark:text-[#a3a3a3]'
              }`}
              aria-hidden="true"
            />
          ) : (
            <div className="w-5 h-5" />
          )}
        </button>

        {/* User Identity Chip */}
        <div className={S.userChip}>
          <div className={S.userAvatar}>
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'S'}
          </div>
          <span className={S.userEmail}>{userEmail || 'superadmin'}</span>
          <span className={S.roleTag}>SUPERADMIN</span>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className={S.signOutButton}
          title={T.signOut}
          aria-label={T.signOut}
        >
          <i className="bx bx-log-out" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
