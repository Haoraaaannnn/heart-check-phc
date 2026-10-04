/**
 * @fileoverview Top navigation header component for the Staff Login page.
 *
 * Renders the home navigation back trigger, Manila-time clock,
 * institutional brand indicator, and light/dark theme toggle.
 *
 * @module app/login/components/LoginHeader
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';
import { LOGIN_TEXTS } from '../constants/loginTexts';
import { LOGIN_STYLES } from '../constants/loginStyles';

/**
 * Top navigation row component for the login view.
 *
 * @returns JSX element.
 */
export function LoginHeader() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const S = LOGIN_STYLES.header;
  const T = LOGIN_TEXTS.header;

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <nav className={S.root}>
      {/* Back to Home Button */}
      <button
        type="button"
        onClick={() => router.push('/')}
        aria-label={T.backToHome}
        className={S.backButton}
      >
        <i className="bx bx-arrow-back text-base" />
        <span>{T.backToHome}</span>
      </button>

      {/* Center Brand Identity */}
      <div className={S.brandCenter}>
        <div className={S.brandBadge}>PHC</div>
        <span className={S.brandTitle}>
          {T.brandName} <span className={S.brandTag}>{T.brandTag}</span>
        </span>
      </div>

      {/* Right Controls: Manila Clock & Theme Toggle */}
      <div className={S.rightGroup}>
        {now && (
          <div className={S.clockContainer}>
            <span className={S.clockDate}>{formatManilaDate(now)}</span>
            <span className={S.clockTime}>{formatManilaTime(now, true)}</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? T.toggleThemeLight : T.toggleThemeDark}
          className={S.themeButton}
        >
          <i className={`bx ${isDark ? 'bx-sun' : 'bx-moon'}`} />
        </button>
      </div>
    </nav>
  );
}
