/** @fileoverview Effect-driven clock for expiring public monitor highlights consistently. */
'use client';
import { useEffect, useState } from 'react';

/**
 * Advances time only while a monitor has an active announcement.
 * @param enabled - Whether the monitor needs an expiry clock.
 * @returns The current epoch milliseconds, updated once per second outside rendering.
 */
export function useCurrentTimeMs(enabled: boolean): number {
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const update = () => setNowMs(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  return nowMs;
}
