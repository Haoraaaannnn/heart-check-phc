/**
 * @fileoverview Authentication and authorization guard hook for the Transfer / Station Management portal.
 *
 * Verifies that the user holds an active session and is assigned an operational role
 * permitted to execute patient routing ('registration', 'nurse', 'staff', 'admin', 'superadmin').
 *
 * @remarks
 * Conforms strictly to AGENTS.md:
 * - Two-layer security: validates role against database auth_id.
 * - Handles bfcache page restoration via 'pageshow' listener.
 * - Zero emojis in code and documentation.
 *
 * @module app/transfer/hooks/useRequireAuth
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const PERMITTED_TRANSFER_ROLES = [
  'registration',
  'nurse',
  'staff',
  'admin',
  'superadmin',
] as const;

/**
 * Transfer portal route access guard hook.
 *
 * @returns Boolean `checking` indicating whether credential validation is underway.
 */
export function useRequireAuth(): boolean {
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

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

      const { data: userRow, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!active) return;

      const userRole = (userRow?.role || '').toLowerCase().trim();

      if (
        roleError ||
        !userRow ||
        !PERMITTED_TRANSFER_ROLES.includes(userRole as any)
      ) {
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