/**
 * @fileoverview Top header bar component for the enterprise Admin Dashboard portal.
 *
 * Implements dynamic breadcrumbs, live Manila-time clock, light/dark theme toggle,
 * bottleneck notifications, authenticated user identity chip, mobile drawer trigger,
 * and direct session sign-out controls.
 *
 * @module app/dashboard/components/navigation/DashboardHeader
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AccountSettingsButton } from '@/components/auth/AccountSettingsButton';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toggleThemeWithRipple } from '@/lib/theme/themeTransition';
import { supabase } from '@/lib/supabase';
import { handleSignOut } from '@/lib/supabase/signOut';
import { useBottleneckNotifications } from '@/app/dashboard/hooks/useBottleneckNotifications';
import NotificationDropdown from '@/app/dashboard/components/NotificationDropdown';
import HeaderSearch from '@/app/dashboard/components/navigation/HeaderSearch';
import LiveClock from '@/app/dashboard/components/navigation/LiveClock';
import { DASHBOARD_NAV_TEXTS } from '@/app/dashboard/constants/dashNavTexts';
import { DASH } from '@/app/dashboard/constants/styles';

/**
 * Properties for the DashboardHeader component.
 */
export interface DashboardHeaderProps {
  /** Optional handler to open the responsive mobile navigation drawer. */
  onOpenMobileDrawer?: () => void;
}

/**
 * Enterprise top navigation header for the Admin Dashboard.
 *
 * @param props - Component configuration properties.
 * @returns JSX element containing the header bar.
 */
export function DashboardHeader({ onOpenMobileDrawer }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<string>(DASHBOARD_NAV_TEXTS.actions.defaultRole);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();

  const S = DASH.header;
  const T = DASHBOARD_NAV_TEXTS;

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useBottleneckNotifications();

  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch authenticated session user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (user.email) setUserEmail(user.email);

        let resolvedUsername = '';
        let resolvedRole = '';

        if (user.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('username, role')
            .eq('auth_id', user.id)
            .maybeSingle();

          if (userData?.username) resolvedUsername = userData.username;
          if (userData?.role) resolvedRole = userData.role;
        }

        if (!resolvedUsername && user.email) {
          const { data: userDataByEmail } = await supabase
            .from('users')
            .select('username, role')
            .ilike('email', user.email)
            .maybeSingle();

          if (userDataByEmail?.username) resolvedUsername = userDataByEmail.username;
          if (userDataByEmail?.role && !resolvedRole) resolvedRole = userDataByEmail.role;
        }

        if (!resolvedUsername) {
          resolvedUsername =
            (user.user_metadata?.username as string) ||
            (user.user_metadata?.name as string) ||
            (user.user_metadata?.full_name as string) ||
            (user.email ? user.email.split('@')[0] : '');
        }

        if (resolvedUsername) {
          setUserName(resolvedUsername);
        }

        if (resolvedRole) {
          setUserRole(resolvedRole.toUpperCase());
        }
      }
    };

    fetchUserDetails();
  }, []);

  /**
   * Handles user session termination and route redirection to login.
   */
  const onSignOut = async () => {
    await handleSignOut();
  };

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithRipple(e, () => {
      setTheme(isDark ? 'light' : 'dark');
    });
  };

  /**
   * Computes dynamic breadcrumb labels according to the active route and query parameters.
   *
   * @returns Object containing section and page breadcrumb strings.
   */
  const getBreadcrumb = (): { section: string; page: string } => {
    const service = searchParams.get('service');

    if (
      pathname.startsWith('/dashboard/pages/cubicles') ||
      pathname.startsWith('/dashboard/cubicles')
    ) {
      return {
        section: T.breadcrumbs.sections.operations,
        page: T.breadcrumbs.pages.cubicles,
      };
    }

    if (
      pathname.startsWith('/dashboard/pages/patients') ||
      pathname.startsWith('/dashboard/patients')
    ) {
      if (service) {
        return {
          section: T.breadcrumbs.sections.services,
          page: service,
        };
      }
      return {
        section: T.breadcrumbs.sections.operations,
        page: T.breadcrumbs.pages.patients,
      };
    }

    if (
      pathname.startsWith('/dashboard/pages/analytics') ||
      pathname.startsWith('/dashboard/analytics')
    ) {
      return {
        section: T.breadcrumbs.sections.intelligence,
        page: T.breadcrumbs.pages.analytics,
      };
    }

    if (
      pathname.startsWith('/dashboard/pages/import') ||
      pathname.startsWith('/dashboard/import')
    ) {
      return {
        section: T.breadcrumbs.sections.operations,
        page: T.breadcrumbs.pages.import,
      };
    }

    if (
      pathname.startsWith('/dashboard/pages/export') ||
      pathname.startsWith('/dashboard/export')
    ) {
      return {
        section: T.breadcrumbs.sections.operations,
        page: T.breadcrumbs.pages.export,
      };
    }

    if (pathname.startsWith('/dashboard/servicesPHC/')) {
      const rawService = pathname.replace('/dashboard/servicesPHC/', '');
      const formatted = rawService
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      return {
        section: T.breadcrumbs.sections.services,
        page: formatted || T.breadcrumbs.sections.services,
      };
    }

    return {
      section: T.breadcrumbs.sections.overview,
      page: T.breadcrumbs.pages.dashboard,
    };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className={S.root}>
      {/* Left: Mobile Drawer Trigger and Dynamic Breadcrumbs */}
      <div className={S.leftGroup}>
        {onOpenMobileDrawer && (
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            className={S.hamburgerButton}
            aria-label={T.actions.toggleDrawer}
          >
            <i className="bx bx-menu text-2xl" aria-hidden="true" />
          </button>
        )}

        <nav aria-label="Breadcrumbs" className={S.breadcrumbs}>
          <span className="font-semibold text-slate-400 dark:text-[#737373]">
            {T.breadcrumbs.root}
          </span>
          <span className={S.breadcrumbSeparator}>/</span>
          <span>{breadcrumb.section}</span>
          <span className={S.breadcrumbSeparator}>/</span>
          <span className={S.breadcrumbActive}>{breadcrumb.page}</span>
        </nav>
      </div>

      {/* Center: Search Box */}
      <HeaderSearch />

      {/* Right: Clock, Theme Toggle, Alerts, User Chip and Sign Out */}
      <div className={S.rightGroup}>
        {/* Live Manila Time Clock */}
        <LiveClock />

        {/* Single-Click Light/Dark Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={S.themeButton}
          title={isDark ? T.actions.themeLight : T.actions.themeDark}
          aria-label={isDark ? T.actions.themeLight : T.actions.themeDark}
        >
          {mounted ? (
            <i
              className={`bx ${isDark
                  ? 'bx-sun text-amber-400'
                  : 'bx-moon text-slate-600 dark:text-[#a3a3a3]'
                }`}
              aria-hidden="true"
            />
          ) : (
            <div className="w-5 h-5" />
          )}
        </button>

        {/* Bottleneck Alerts Dropdown */}
        {mounted && (
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDismiss={dismissNotification}
            onClearAll={clearAll}
          />
        )}

        {/* Authenticated User Identity Chip */}
        <div className={S.userChip}>
          <div className={S.userAvatar}>
            {(userName || userEmail || 'A').charAt(0).toUpperCase()}
          </div>
          <span className={S.userEmail} title={userEmail || userName}>
            {userName || (userEmail ? userEmail.split('@')[0] : T.actions.defaultUserName)}
          </span>
          <span className={S.roleTag}>{userRole}</span>
        </div>

        {/* Direct Session Sign-Out Button */}
        <AccountSettingsButton />
        <button
          type="button"
          onClick={onSignOut}
          className={S.signOutButton}
          title={T.actions.signOut}
          aria-label={T.actions.signOut}
        >
          <i className="bx bx-log-out" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
