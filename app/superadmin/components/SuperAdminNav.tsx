/**
 * @fileoverview Top navigation bar component for the SuperAdmin portal.
 *
 * Provides hospital brand identity, active route indicators for user accounts,
 * system settings, facilities, and kiosk customization, current user email badge,
 * light/dark theme switcher, and secure session sign-out.
 *
 * @module app/superadmin/components/SuperAdminNav
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { handleSignOut as executeSignOut } from '@/lib/supabase/signOut';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

/**
 * Superadmin navigation bar component with integrated light/dark theme toggle.
 *
 * @returns JSX element containing the top navigation bar.
 */
export default function SuperAdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userEmail, setUserEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const S = SUPERADMIN_STYLES.navigation;
  const T = SUPERADMIN_TEXTS.navigation;

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await executeSignOut();
  };

  const activeTab = searchParams.get('tab') || 'users';

  const isUsersActive = pathname === '/superadmin' && activeTab === 'users';
  const isSettingsActive = pathname === '/superadmin' && activeTab === 'settings';
  const isFacilitiesActive = pathname.startsWith('/superadmin/facilities');
  const isCustomizationActive = pathname.startsWith('/superadmin/customization');

  const navLinks = [
    {
      href: '/superadmin',
      label: T.usersTab,
      icon: 'bx-group',
      active: isUsersActive,
    },
    {
      href: '/superadmin?tab=settings',
      label: T.settingsTab,
      icon: 'bx-cog',
      active: isSettingsActive,
    },
    {
      href: '/superadmin/facilities',
      label: T.facilitiesLink,
      icon: 'bx-building',
      active: isFacilitiesActive,
    },
    {
      href: '/superadmin/customization',
      label: T.customizationLink,
      icon: 'bx-slider',
      active: isCustomizationActive,
    },
  ];

  return (
    <nav className={S.bar} aria-label="Superadmin Navigation">
      <div className={S.barInner}>
        {/* Brand Group */}
        <div className={S.brandGroup}>
          <Link href="/superadmin" className="flex items-center gap-3 group">
            <div className={S.brandBadge}>
              <span>PHC</span>
            </div>
            <div>
              <div className={S.brandTitle}>Philippine Heart Center</div>
              <div className={S.brandSubtitle}>SuperAdmin Portal</div>
            </div>
          </Link>
        </div>

        {/* Desktop Route Links */}
        <div className={S.navLinksGroup}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${S.navLink} ${
                link.active ? S.navLinkActive : S.navLinkIdle
              }`}
            >
              <i className={`bx ${link.icon} text-base`} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* User Session, Theme Toggle & Actions */}
        <div className={S.userSection}>
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={S.themeToggleButton}
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

          {/* User Badge */}
          <div className={S.userBadge}>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#f5f5f5] flex items-center justify-center font-bold text-xs">
              <i
                className="bx bxs-user-badge text-base text-[#a8071a] dark:text-[#f87171]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col items-start">
              <span className={S.userEmail}>{userEmail || 'superadmin'}</span>
              <span className={S.userRolePill}>{T.superadminRoleBadge}</span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className={S.signOutButton}
            title={T.signOut}
            aria-label={T.signOut}
          >
            <i className="bx bx-log-out text-sm" aria-hidden="true" />
            <span className="hidden sm:inline">{T.signOut}</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#242424]"
            aria-label="Toggle navigation menu"
          >
            <i
              className={`bx ${mobileMenuOpen ? 'bx-x' : 'bx-menu'} text-2xl`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={S.mobileMenu}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                link.active ? S.navLinkActive : S.navLinkIdle
              }`}
            >
              <i className={`bx ${link.icon} text-lg`} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          ))}

          <div className={S.mobileDivider}>
            <span className="text-xs text-slate-500 dark:text-[#a3a3a3] font-medium">
              Theme Mode
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className={S.themeToggleButton}
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
          </div>
        </div>
      )}
    </nav>
  );
}