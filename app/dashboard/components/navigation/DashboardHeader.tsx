'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { useBottleneckNotifications } from '@/app/dashboard/hooks/useBottleneckNotifications';
import NotificationDropdown from '../NotificationDropdown';
import HeaderSearch from './HeaderSearch';
import LiveClock from './LiveClock';
import { DASHBOARD_USER } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { APP_INFO } from '@/constants/app';

const S = DASH.header;

/**
 * Top bar of the admin dashboard.
 *
 * Left to right: hospital brand, search, theme toggle, notifications,
 * Manila clock, signed-in user, logout.
 *
 * Theme switching uses next-themes (class on <html>), so every semantic token
 * in globals.css flips automatically.
 */
export default function DashboardHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useBottleneckNotifications();

  // next-themes and notifications are client-only; render them after mount.
  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className={S.root}>
      {/* Brand */}
      <div className={S.brand}>
        <div>
          <p className={S.brandTitle}>{APP_INFO.hospitalName}</p>
          <p className={S.brandTagline}>{APP_INFO.tagline}</p>
        </div>
      </div>

      <HeaderSearch />

      <div className={S.actions}>
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={S.iconButton}
            aria-label="Toggle dark mode"
          >
            <i className={theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon'} />
          </button>
        )}

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

        <LiveClock />

        <div className={S.user}>
          <span className={S.avatar}>
            <i className="bx bxs-user" />
          </span>
          <div className={S.userText}>
            <p className={S.userName}>{DASHBOARD_USER.name}</p>
            <p className={S.userRole}>{DASHBOARD_USER.role}</p>
          </div>
          <button type="button" onClick={handleLogout} className={S.logout} aria-label="Log out" title="Log out">
            <i className="bx bx-log-out" />
          </button>
        </div>
      </div>
    </header>
  );
}