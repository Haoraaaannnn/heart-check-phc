/**
 * @fileoverview Hook for resolving authenticated staff credentials and role permissions.
 *
 * Communicates with Supabase Auth and the `users` table to identify the current
 * staff member and protect the Screen Display Selector route.
 *
 * @module app/select-screen/hooks/useCurrentStaff
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CurrentStaffProfile } from '../types/selectScreen';

/**
 * Resolves current staff auth session and users table profile.
 *
 * @returns An object containing the current staff profile, loading state, error, and signOut callback.
 */
export function useCurrentStaff() {
  const router = useRouter();
  const [staff, setStaff] = useState<CurrentStaffProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStaffProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace('/login');
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
    };
  }, [router]);

  /**
   * Clears the current Supabase session and redirects back to the login page.
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.push('/login');
    }
  }, [router]);

  return { staff, loading, error, signOut };
}
