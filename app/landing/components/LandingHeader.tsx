/**
 * @fileoverview Top navigation header component for the Public Landing Page.
 *
 * Renders the Philippine Heart Center brand badge, live Manila-time clock,
 * and light/dark theme toggle.
 *
 * @module app/landing/components/LandingHeader
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';
import { LANDING_TEXTS } from '@/app/landing/constants/landingTexts';
import { LANDING_STYLES } from '@/app/landing/constants/landingStyles';
import { BrandLogo } from '@/components/reusables/BrandLogo';
import { toggleThemeWithRipple } from '@/lib/theme/themeTransition';

/**
 * Top enterprise navigation header for the landing page.
 *
 * @returns JSX element.
 */
export function LandingHeader() {
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
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithRipple(e, () => {
      setTheme(isDark ? 'light' : 'dark');
    });
  };

  return (
    <header className={S.root}>
      {/* Brand Identity */}
      <div className={S.brandGroup}>
        <BrandLogo variant="icon" className="h-10 w-auto" />
      </div>

      {/* Right Controls: Manila Clock, Theme Toggle */}
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
      </div>
    </header>
  );
}
