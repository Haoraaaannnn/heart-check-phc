/** @fileoverview Shared staff role guard with coalesced checks and non-destructive connection recovery. */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Verified browser session identity paired with its current database role. */
interface VerifiedStaff { userId: string; role: string; allowedWorkstations: readonly unknown[] | null; }
let pendingCheck: Promise<VerifiedStaff | null> | null = null;

/**
 * Coalesces layout and page checks without caching stale role permissions.
 * @returns Verified identity and role, or null when the session is definitively absent.
 */
async function verifyCurrentStaff(): Promise<VerifiedStaff | null> {
  if (pendingCheck) return pendingCheck;
  const check = (async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) return null;
    const { data, error: roleError } = await supabase.from('users').select('role').eq('auth_id', session.user.id).maybeSingle();
    if (roleError) throw roleError;
    const workstations: unknown = session.user.user_metadata?.allowed_workstations;
    return { userId: session.user.id, role: String(data?.role ?? '').toLowerCase().trim(),
      allowedWorkstations: Array.isArray(workstations) ? workstations : null };
  })();
  pendingCheck = check;
  try { return await check; }
  finally { if (pendingCheck === check) pendingCheck = null; }
}

/**
 * Checks staff access without treating token refresh or transient network failures as logout.
 * @param roles - Roles allowed by the page, in addition to server guards and RLS.
 * @param workstation - Optional workstation checked against the account's configured access list.
 * @returns True until the caller's role is verified.
 */
export function useStaffAuthorization(roles: readonly string[], workstation?: string): boolean {
  const [checking, setChecking] = useState(true);
  const roleKey = roles.join(',');
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let requestId = 0;
    const allowed = new Set(roleKey.split(','));
    /** Retries connection errors while retaining the existing authenticated session. */
    const check = async () => {
      const id = ++requestId;
      try {
        const staff = await verifyCurrentStaff();
        if (disposed || id !== requestId) return;
        if (!staff) { window.location.replace('/login'); return; }
        if (!allowed.has(staff.role)) { window.location.replace('/unauthorized'); return; }
        if (workstation && staff.allowedWorkstations && !staff.allowedWorkstations.includes(workstation)) {
          window.location.replace('/unauthorized'); return;
        }
        setChecking(false);
      } catch {
        if (!disposed && id === requestId) timer = setTimeout(() => void check(), 2000);
      }
    };
    /** Auth events are synchronous; defer SDK work until its internal auth lock is released. */
    const scheduleCheck = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => void check(), 0); };
    /** Restored pages revalidate access without reloading this or any sibling tab. */
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) { setChecking(true); scheduleCheck(); }
    };
    window.addEventListener('pageshow', onPageShow);
    scheduleCheck();
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (disposed) return;
      if (event === 'SIGNED_OUT') { ++requestId; window.location.replace('/login'); }
      else if (event === 'SIGNED_IN') { ++requestId; scheduleCheck(); }
    });
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('pageshow', onPageShow);
      listener.subscription.unsubscribe();
    };
  }, [roleKey, workstation]);
  return checking;
}
