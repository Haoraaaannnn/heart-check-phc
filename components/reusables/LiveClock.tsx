/**
 * @fileoverview Reusable Live Manila Time clock component for enterprise workstation headers.
 *
 * Displays Philippine Standard Time (PST, Asia/Manila) with real-time per-second
 * updating, safe client hydration mounting, and tabular font styling.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: pure assembly and rendering, zero emojis,
 * consumes centralized themeTokens and sizeTokens, and eliminates hydration mismatch.
 *
 * @module components/reusables/LiveClock
 */

'use client';

import React, { useEffect, useState } from 'react';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';
import { themeTokens, sizeTokens } from '@/constants/themeTokens';

/**
 * Properties for the LiveClock component.
 */
export interface LiveClockProps {
  /** Optional custom container class name override. */
  className?: string;
}

/**
 * Enterprise live ticking Manila clock display for top navigation headers.
 *
 * @param props - Component configuration properties.
 * @returns JSX element containing formatted date and time.
 */
export function LiveClock({ className }: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialTimer = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const defaultContainerClass = `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`;

  return (
    <div className={className || defaultContainerClass}>
      <p className={`${sizeTokens.typography.micro} ${themeTokens.text.muted}`}>
        {now ? formatManilaDate(now) : '--'}
      </p>
      <p className={`text-xs font-mono font-bold ${themeTokens.text.primary}`}>
        {now ? formatManilaTime(now, true) : '--:--:--'}
      </p>
    </div>
  );
}

export default LiveClock;
