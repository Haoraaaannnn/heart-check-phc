'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NURSE_ROLES = ['nurse', 'staff', 'doctor'];

export function useRequireAuth() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .single();

      if (
        error ||
        !profile ||
        !NURSE_ROLES.includes(profile.role)
      ) {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }

      if (active) {
        setChecking(false);
      }
    };

    void verifyAccess();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace('/login');
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return checking;
}