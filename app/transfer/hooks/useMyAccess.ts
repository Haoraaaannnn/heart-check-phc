'use client';

/**
 * @fileoverview Hook managing user service, room, and counter access permissions
 * for the Patient Transfer dashboard.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '../lib/constants';

/**
 * Access descriptor for a specific consultation or screening room.
 */
export interface RoomAccess {
  service: string;
  subcategory: string | null;
  room: number;
}

/**
 * Verification state of user access permissions.
 */
export type AccessStatus = 'loading' | 'assigned' | 'unassigned' | 'error';

/**
 * Hook to retrieve and cache the authenticated user's assigned services, rooms, and counters.
 *
 * @returns User access lists, current verification status, and refresh function.
 */
export function useMyAccess() {
  const [myServices, setMyServices] = useState<string[]>([]);
  const [myRooms, setMyRooms] = useState<RoomAccess[]>([]);
  const [myCounters, setMyCounters] = useState<number[]>([]);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');

  const fetchMyAccess = useCallback(async () => {
    setAccessStatus('loading');

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('useMyAccess: No active session found', sessionError);
        setAccessStatus('error');
        return;
      }

      // Try finding user record by auth_id first, then fallback to email
      let user: { id: string | number; role?: string } | null = null;

      const { data: userByAuth, error: authQueryError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (userByAuth) {
        user = userByAuth;
      } else if (session.user.email) {
        const { data: userByEmail, error: emailQueryError } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', session.user.email)
          .maybeSingle();

        if (userByEmail) {
          user = userByEmail;
        } else {
          console.warn('useMyAccess: User not found in users table by auth_id or email', {
            authQueryError,
            emailQueryError,
          });
        }
      }

      if (!user) {
        setAccessStatus('error');
        return;
      }

      const [
        { data: services, error: e1 },
        { data: rooms, error: e2 },
        { data: counters, error: e3 },
      ] = await Promise.all([
        supabase.from('user_services').select('service').eq('user_id', user.id),
        supabase.from('user_rooms').select('service, subcategory, room').eq('user_id', user.id),
        supabase.from('user_counters').select('counter').eq('user_id', user.id),
      ]);

      if (e1 || e2 || e3) {
        console.error('useMyAccess: Error fetching user permissions', { e1, e2, e3 });
        setAccessStatus('error');
        return;
      }

      const serviceList = (services ?? []).map(s => s.service);

      // If user is superadmin or admin and has no custom restrictions, grant full access
      if ((user.role === 'superadmin' || user.role === 'admin') && serviceList.length === 0) {
        setMyServices(CATEGORIES);
        setMyRooms([]);
        setMyCounters([1, 2, 3, 4, 5]);
        setAccessStatus('assigned');
        return;
      }

      setMyServices(serviceList);
      setMyRooms((rooms ?? []) as RoomAccess[]);
      setMyCounters((counters ?? []).map(c => c.counter));
      setAccessStatus(serviceList.length > 0 ? 'assigned' : 'unassigned');
    } catch (err) {
      console.error('useMyAccess: Unexpected exception while verifying access', err);
      setAccessStatus('error');
    }
  }, []);

  return { myServices, myRooms, myCounters, accessStatus, fetchMyAccess };
}

export default useMyAccess;