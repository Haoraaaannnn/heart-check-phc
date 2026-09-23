'use client';

import { useEffect, useState } from 'react';

interface MountedClock {
  /** False during SSR/first paint, true once the client has mounted. */
  isMounted: boolean;
  /** Current time, refreshed every `intervalMs`. Null until mounted. */
  currentTime: Date | null;
}

/**
 * SSR-safe "has this mounted yet" flag plus a periodically-refreshed clock.
 *
 * The two setState calls below run synchronously in the effect body by
 * design: they seed one-time mount state and the initial clock reading, not
 * a cascading update in response to a prop/state change. The
 * react-hooks/set-state-in-effect advisory is expected here and
 * intentionally suppressed, in this one place, instead of scattering
 * eslint-disable comments across every page that needs a mount flag.
 *
 * @param intervalMs - How often the clock refreshes (default 60s).
 */
export function useMountedClock(intervalMs = 60000): MountedClock {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount seed, not a cascading update
    setIsMounted(true);
     
    setCurrentTime(new Date());

    const timer = setInterval(() => setCurrentTime(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return { isMounted, currentTime };
}