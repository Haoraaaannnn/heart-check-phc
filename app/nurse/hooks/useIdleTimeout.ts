/**
 * @fileoverview Clinical inactivity monitor hook for the Nurse Dashboard.
 *
 * Automatically logs out clinical staff after 20 minutes of inactivity
 * to protect patient privacy and preserve healthcare session integrity.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** Inactivity limit in milliseconds (20 minutes) */
const IDLE_LIMIT_MS = 20 * 60 * 1000;

/** User interaction events that reset the activity countdown */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Custom React hook monitoring user activity to enforce automatic session timeout.
 */
export function useIdleTimeout(): void {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login?reason=idle');
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(logout, IDLE_LIMIT_MS);
  }, [logout]);

  useEffect(() => {
    resetTimer();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [resetTimer]);
}

export default useIdleTimeout;