/**
 * @fileoverview Authentication and authorization guard hook for the SuperAdmin portal.
 *
 * Verifies that the caller holds an active authenticated session and possesses
 * the 'superadmin' role in the `users` table. If unauthenticated, replaces
 * history to `/login`. If unauthorized, replaces history to `/unauthorized`.
 *
 * @remarks
 * Conforms strictly to AGENTS.md:
 * - Two-layer security: validates role against database auth_id.
 * - Handles bfcache page restoration via 'pageshow' listener.
 * - Zero emojis in code and documentation.
 *
 * @module app/superadmin/hooks/useRequireAuth
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * SuperAdmin route access guard hook.
 *
 * @returns Boolean `checking` indicating if access validation is still active.
 */
export function useRequireAuth(): boolean {
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    /**
     * Re-validates active session when restored from browser bfcache.
     */
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    const verifyAccess = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !session) {
        window.location.replace('/login');
        return;
      }

      // Query user role strictly by auth_id primary relationship
      const { data: userRow, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!active) return;

      const userRole = (userRow?.role || '').toLowerCase().trim();

      if (roleError || !userRow || userRole !== 'superadmin') {
        window.location.replace('/unauthorized');
        return;
      }

      setChecking(false);
    };

    void verifyAccess();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.replace('/login');
      }
    });

    return () => {
      active = false;
      window.removeEventListener('pageshow', handlePageShow);
      listener.subscription.unsubscribe();
    };
  }, []);

  return checking;
}

export default useRequireAuth;