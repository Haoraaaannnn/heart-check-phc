/**
 * @fileoverview Header component for the Screen Display Selector module.
 *
 * Implements enterprise top navigation matching Dashboard and SuperAdmin standards:
 * system brand badge, live Manila-time clock, light/dark theme toggle,
 * authenticated staff identity chip, and session sign-out control.
 *
 * @module app/select-screen/components/SelectScreenHeader
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';
import { CurrentStaffProfile } from '../types/selectScreen';
import { SELECT_SCREEN_STYLES } from '../constants/selectScreen';
import { SELECT_SCREEN_TEXTS } from '../constants/selectScreenTexts';

interface SelectScreenHeaderProps {
  /** Authenticated staff profile information. */
  staff: CurrentStaffProfile | null;
  /** Callback triggered to sign out the active staff session. */
  onSignOut: () => void;
}

/**
 * Enterprise navigation header and hero banner for the Screen Display Selector.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function SelectScreenHeader({ staff, onSignOut }: SelectScreenHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const S = SELECT_SCREEN_STYLES.header;
  const H = SELECT_SCREEN_STYLES.hero;
  const T = SELECT_SCREEN_TEXTS.header;

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const staffInitial = staff?.username ? staff.username.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Enterprise Top Sticky Header */}
      <header className={S.root}>
        {/* Brand Group */}
        <div className={S.brandGroup}>
          <div className={S.brandBadge}>PHC</div>
          <div className={S.brandTitlesWrap}>
            <span className={S.brandTitle}>
              {T.brandName} <span className={S.brandTag}>{T.brandTag}</span>
            </span>
            <span className={S.brandSubtitle}>{T.subBrand}</span>
          </div>
        </div>

        {/* Right Group: Manila Clock, Theme Toggle, Staff Identity Chip, Sign Out */}
        <div className={S.rightGroup}>
          {now && (
            <div className={S.clockContainer}>
              <span className={S.clockDate}>{formatManilaDate(now)}</span>
              <span className={S.clockTime}>{formatManilaTime(now, true)}</span>
            </div>
          )}

          {/* Dual-Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? T.toggleThemeLight : T.toggleThemeDark}
            className={S.themeButton}
          >
            <i className={`bx ${isDark ? 'bx-sun' : 'bx-moon'}`} />
          </button>

          {/* Staff User Chip */}
          {staff && (
            <div className={S.userChip}>
              <div className={S.userAvatar}>{staffInitial}</div>
              <span className={S.userName}>{staff.username}</span>
              <span className={S.roleTag}>{staff.role}</span>
            </div>
          )}

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            aria-label={T.signOutButton}
            title={T.signOutButton}
            className={S.signOutBtn}
          >
            <i className="bx bx-log-out" />
          </button>
        </div>
      </header>

      {/* Hero / Page Scope Description */}
      <div className={H.wrapper}>
        <div className={H.titlesWrap}>
          <div className={H.tagPill}>
            <span className={H.pulseDot} />
            <span>{T.tagPill}</span>
          </div>
          <h1 className={H.title}>{T.pageTitle}</h1>
          <p className={H.subtitle}>{T.pageSubtitle}</p>
        </div>
      </div>
    </>
  );
}
