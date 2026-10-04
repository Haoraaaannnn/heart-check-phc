'use client';

import { useEffect, useState } from 'react';
import { DASH } from '@/app/dashboard/constants/styles';
import { formatManilaDate, formatManilaTime } from '@/utils/formatDateTime';

const S = DASH.header;

/**
 * Header date + live clock in Manila time, ticking every second.
 *
 * Kept as its own component so the per-second re-render doesn't touch the rest
 * of the header. Renders placeholders until mounted to avoid a hydration
 * mismatch (server and browser would otherwise disagree on the time).
 */
export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={S.clock}>
      <p className={S.clockDate}>{now ? formatManilaDate(now) : '--'}</p>
      <p className={S.clockTime}>{now ? formatManilaTime(now, true) : '--:--:--'}</p>
    </div>
  );
}