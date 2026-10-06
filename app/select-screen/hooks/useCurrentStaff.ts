/**
 * @fileoverview Hook for resolving authenticated staff credentials and role permissions.
 *
 * Communicates with Supabase Auth and the `users` table to identify the current
 * staff member and protect the Screen Display Selector route.
 *
 * @module app/select-screen/hooks/useCurrentStaff
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { handleSignOut } from '@/lib/supabase/signOut';
import { CurrentStaffProfile } from '../types/selectScreen';

/**
 * Resolves current staff auth session and users table profile.
 *
 * @returns An object containing the current staff profile, loading state, error, and signOut callback.
 */
export function useCurrentStaff() {
  const [staff, setStaff] = useState<CurrentStaffProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    async function loadStaffProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          window.location.replace('/login');
          return;
        }

        const { data: userRow, error: dbError } = await supabase
          .from('users')
          .select('auth_id, email, username, role')
          .eq('auth_id', user.id)
          .single();

        if (dbError || !userRow) {
          if (isMounted) {
            setError('Failed to resolve staff role permissions from the database.');
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setStaff({
            authId: userRow.auth_id,
            email: userRow.email || user.email || '',
            username: userRow.username || user.email?.split('@')[0] || 'Staff',
            role: (userRow.role || '').toLowerCase().trim(),
          });
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error resolving staff session.');
          setLoading(false);
        }
      }
    }

    loadStaffProfile();

    return () => {
      isMounted = false;
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  /**
   * Clears the current Supabase session, destroys cookies, and replaces history to login.
   */
  const signOut = useCallback(async () => {
    await handleSignOut();
  }, []);

  return { staff, loading, error, signOut };
}
