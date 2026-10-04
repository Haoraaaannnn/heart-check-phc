/**
 * @fileoverview Top navigation header component for the Public Landing Page.
 *
 * Renders the Philippine Heart Center brand badge, live Manila-time clock,
 * light/dark theme toggle, and direct navigation trigger for staff authentication.
 *
 * @module app/landing/components/LandingHeader
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';
import { LANDING_TEXTS } from '../constants/landingTexts';
import { LANDING_STYLES } from '../constants/landingStyles';

/**
 * Top enterprise navigation header for the landing page.
 *
 * @returns JSX element.
 */
export function LandingHeader() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const S = LANDING_STYLES.header;
  const T = LANDING_TEXTS.header;

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <header className={S.root}>
      {/* Brand Identity */}
      <div className={S.brandGroup}>
        <div className={S.brandBadge}>PHC</div>
        <div className={S.brandTitlesWrap}>
          <span className={S.brandTitle}>
            {T.brandName} <span className={S.brandTag}>{T.brandTag}</span>
          </span>
          <span className={S.brandSubtitle}>{T.subBrand}</span>
        </div>
      </div>

      {/* Right Controls: Manila Clock, Theme Toggle, Login */}
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

        {/* Staff Login CTA */}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className={S.loginButton}
        >
          <i className="bx bx-log-in-circle text-sm" />
          <span>{T.staffLoginBtn}</span>
        </button>
      </div>
    </header>
  );
}
