/** @fileoverview One inactivity timer per document, synchronized across authenticated staff tabs. */
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { handleSignOut } from '@/lib/supabase/signOut';
import { parseSessionMinutes, SESSION_POLICY, SESSION_POLICY_EVENT, SESSION_POLICY_STORAGE, sessionActivityKey, SessionActivityClock } from '@/lib/sessionPolicy';

/** Shared countdown available to authenticated workstation headers and settings. */
interface StaffSessionState { remainingSeconds: number | null; timeoutMinutes: number; }
const StaffSessionContext = createContext<StaffSessionState>({ remainingSeconds: null, timeoutMinutes: SESSION_POLICY.defaultMinutes });

/**
 * Tracks activity on staff routes without allowing an unused tab to expire an active shared session.
 * @param props - Application children; public monitors and kiosks do not start staff timers.
 * @returns Session context around otherwise unchanged application content.
 */
export function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const staffRoute = /^\/(select-screen|transfer|nurse|dashboard|superadmin)(\/|$)/.test(pathname);
  const [state, setState] = useState<StaffSessionState>({ remainingSeconds: null, timeoutMinutes: SESSION_POLICY.defaultMinutes });

  useEffect(() => {
    if (!staffRoute) return;
    let disposed = false;
    let clock: SessionActivityClock | null = null;
    let minutes: number = SESSION_POLICY.defaultMinutes;
    let userId: string | null = null;
    let signingOut = false;
    let refreshingPolicy = false;
    let policyReady = false;
    let lastRecorded = 0;
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* Use the clock's in-memory fallback. */ }

    /** Rechecks shared activity immediately before expiring this browser session. */
    const check = () => {
      if (disposed || !clock || signingOut || !policyReady) return;
      const remaining = clock.remaining(minutes, Date.now());
      setState({ timeoutMinutes: minutes, remainingSeconds: Math.ceil(remaining / 1000) });
      if (remaining === 0) {
        signingOut = true;
        void expireCurrentSession();
      }
    };

    /** An old background tab must never revoke a newer login that replaced its session cookie. */
    const expireCurrentSession = async () => {
      const expectedKey = clock?.key;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (disposed || error) return;
        if (!session) { window.location.replace('/login'); return; }
        const currentKey = sessionActivityKey(session.access_token, session.user.id);
        if (expectedKey !== currentKey) {
          clock = new SessionActivityClock(storage, currentKey, Date.now());
          if (userId !== session.user.id) window.location.replace('/select-screen');
          userId = session.user.id;
          return;
        }
        if (clock && clock.remaining(minutes, Date.now()) === 0) await handleSignOut('/login?reason=idle');
      } catch { /* A failed verification is retried by the next timer tick. */ }
      finally { signingOut = false; }
    };

    /** Applies validated policy changes from the current tab or another staff tab. */
    const applyPolicy = (value: unknown) => {
      const next = parseSessionMinutes(value);
      if (next !== null) { minutes = next; check(); }
    };

    /** Refreshes policy outside Supabase auth callbacks so its auth lock is never re-entered. */
    const refreshPolicy = async () => {
      if (refreshingPolicy || disposed) return;
      refreshingPolicy = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || disposed) return;
        const nextKey = sessionActivityKey(session.access_token, session.user.id);
        if (userId && userId !== session.user.id) { window.location.replace('/select-screen'); return; }
        userId = session.user.id;
        if (!clock || clock.key !== nextKey) clock = new SessionActivityClock(storage, nextKey, Date.now());
        const response = await fetch('/api/auth/session-policy', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
        if (disposed) return;
        policyReady = true;
        if (response.ok) applyPolicy((await response.json()).minutes);
        else check();
      } catch { policyReady = true; check(); /* A temporary connection failure must not revoke a valid session. */ }
      finally { refreshingPolicy = false; }
    };

    /** Records local interaction, while reading other tabs before making any expiry decision. */
    const activity = () => {
      if (!clock || signingOut || disposed) return;
      const now = Date.now();
      if (now - lastRecorded < 1000) return;
      lastRecorded = now;
      if (!clock.record(minutes, now)) { check(); return; }
      check();
    };
    /** Storage events update policy/countdowns without reloading any page. */
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_POLICY_STORAGE) applyPolicy(event.newValue);
      else if (event.key === clock?.key) check();
    };
    /** Resuming a background tab checks shared activity rather than resetting the deadline. */
    const visibility = () => { if (document.visibilityState === 'visible') check(); };
    /** Same-tab saves use a custom event because storage events only reach sibling tabs. */
    const policyChanged = (event: Event) => applyPolicy((event as CustomEvent<number>).detail);
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, activity, { passive: true }));
    window.addEventListener('storage', onStorage);
    window.addEventListener(SESSION_POLICY_EVENT, policyChanged);
    document.addEventListener('visibilitychange', visibility);
    try { applyPolicy(storage?.getItem(SESSION_POLICY_STORAGE)); } catch { /* Keep the existing default. */ }
    const initial = setTimeout(() => void refreshPolicy(), 0);
    const ticker = setInterval(check, 1000);
    const policyTimer = setInterval(() => void refreshPolicy(), 60000);
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (disposed) return;
      if (event === 'SIGNED_OUT') { clock = null; window.location.replace('/login'); }
      else if (event === 'SIGNED_IN' && session) {
        if (userId && userId !== session.user.id) { window.location.replace('/select-screen'); return; }
        const key = sessionActivityKey(session.access_token, session.user.id);
        userId = session.user.id;
        if (!clock || clock.key !== key) clock = new SessionActivityClock(storage, key, Date.now());
        check();
      }
    });
    return () => {
      disposed = true;
      clearTimeout(initial); clearInterval(ticker); clearInterval(policyTimer);
      events.forEach(event => window.removeEventListener(event, activity));
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SESSION_POLICY_EVENT, policyChanged);
      document.removeEventListener('visibilitychange', visibility);
      listener.subscription.unsubscribe();
    };
  }, [staffRoute]);
  return <StaffSessionContext.Provider value={state}>{children}</StaffSessionContext.Provider>;
}

/** @returns The one shared staff countdown; does not create an additional idle timer. */
export function useStaffSession(): StaffSessionState { return useContext(StaffSessionContext); }
