/**
 * @fileoverview Live Manila Time clock component for the Admin Dashboard header.
 *
 * Displays Philippine Standard Time (PST, Asia/Manila) with real-time per-second
 * updating, safe client hydration mounting, and tabular font styling.
 *
 * @module app/dashboard/components/navigation/LiveClock
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DASH } from '@/app/dashboard/constants/styles';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';

const S = DASH.header;

/**
 * Live ticking Manila clock display for the top navigation header.
 *
 * @returns JSX element.
 */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={S.clockContainer || S.clock}>
      <p className={S.clockDate}>{now ? formatManilaDate(now) : '--'}</p>
      <p className={S.clockTime}>{now ? formatManilaTime(now, true) : '--:--:--'}</p>
    </div>
  );
}

export default LiveClock;