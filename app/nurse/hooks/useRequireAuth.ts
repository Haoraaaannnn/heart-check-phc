/**
 * @fileoverview Authentication and clinical authorization guard hook for the Nurse Dashboard.
 *
 * Verifies active session and ensures the user holds a permitted clinical role
 * ('nurse', 'staff', 'doctor', 'superadmin', 'admin').
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** Permitted clinical roles authorized to access the Nurse Station */
const PERMITTED_NURSE_ROLES = ['nurse', 'staff', 'doctor', 'superadmin', 'admin'] as const;

/**
 * Authentication and role verification guard hook.
 *
 * @returns Boolean `checking` indicating if authentication validation is still in progress.
 */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.replace('/login');
        return;
      }

      // Query user role by auth_id first, then fallback to email
      let userRole: string | null = null;

      const { data: userByAuth } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (userByAuth) {
        userRole = userByAuth.role;
      } else if (session.user.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .maybeSingle();

        if (userByEmail) {
          userRole = userByEmail.role;
        }
      }

      if (!userRole || !PERMITTED_NURSE_ROLES.includes(userRole as any)) {
        console.warn('Unauthorized role access attempt to Nurse Station:', userRole);
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }

      if (active) {
        setChecking(false);
      }
    };

    void verifyAccess();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return checking;
}

export default useRequireAuth;