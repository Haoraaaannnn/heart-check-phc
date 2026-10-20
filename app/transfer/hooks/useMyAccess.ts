'use client';

/**
 * @fileoverview Custom hook for verifying user role, service access, room authorizations,
 * and registration counter permissions within the Patient Transfer Dashboard.
 *
 * Implements Superadmin and Admin permission elevation to view all active hospital services,
 * counters, and rooms without explicit `user_services` or `user_rooms` records.
 * Queries the dynamic `services` catalog to provide service definitions and fallback capabilities.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Comprehensive JSDoc with @param and @returns
 * - Strict separation of concerns
 * - Zero emojis in comments or logs
 *
 * @module app/transfer/hooks/useMyAccess
 */

import { fetchActiveCounters } from '@/lib/counters';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/app/transfer/lib/constants';
import { Service } from '@/types/Services';

/**
 * Represents authorized physical room allocation mapped to a specific service.
 */
export interface RoomAccess {
  /** Service identifier or display name matching service catalog. */
  service: string;
  /** Subcategory triage target (e.g., 'Adult', 'Pedia'), or null if unsegmented. */
  subcategory: string | null;
  /** Physical room number in the outpatient department. */
  room: number;
}

/**
 * Status indicator for user authorization and access verification lifecycle.
 */
export type AccessStatus = 'loading' | 'assigned' | 'unassigned' | 'error';

/**
 * Return model for the useMyAccess hook.
 */
export interface UseMyAccessReturn {
  /** Array of service names authorized for the current user. */
  myServices: string[];
  /** Array of room allocations authorized for the current user. */
  myRooms: RoomAccess[];
  /** Array of active registration counter numbers accessible by the user. */
  myCounters: number[];
  /** Current state of authorization checking. */
  accessStatus: AccessStatus;
  /** Callback to trigger re-verification and fetch of access rules. */
  fetchMyAccess: () => Promise<void>;
  /** Complete hospital clinical services catalog loaded from PostgreSQL. */
  allServices: Service[];
}

/**
 * Hook to resolve and manage transfer dashboard access authorizations.
 *
 * @returns Access authorizations, counter lists, dynamic service catalog, and fetch callback.
 * @remarks Evaluates authentication session, maps user roles, loads `user_services`,
 * `user_rooms`, `user_counters`, and `services` catalog records concurrently.
 */
export function useMyAccess(): UseMyAccessReturn {
  const [myServices, setMyServices] = useState<string[]>([]);
  const [myRooms, setMyRooms] = useState<RoomAccess[]>([]);
  const [myCounters, setMyCounters] = useState<number[]>([]);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');
  const [allServices, setAllServices] = useState<Service[]>([]);

  const fetchMyAccess = useCallback(async () => {
    setAccessStatus('loading');

    const activeCounters = await fetchActiveCounters();

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
        { data: dbServices, error: e4 },
      ] = await Promise.all([
        supabase.from('user_services').select('service').eq('user_id', user.id),
        supabase.from('user_rooms').select('service, subcategory, room').eq('user_id', user.id),
        supabase.from('user_counters').select('counter').eq('user_id', user.id),
        supabase.from('services').select('*').order('display_order', { ascending: true }),
      ]);

      if (e1 || e2 || e3) {
        console.error('useMyAccess: Error fetching user permissions', { e1, e2, e3, e4 });
        setAccessStatus('error');
        return;
      }

      if (e4) {
        console.warn('useMyAccess: Non-fatal warning fetching services catalog', e4);
      }

      const availableServices = (dbServices ?? []) as Service[];
      setAllServices(availableServices);

      const serviceList = (services ?? []).map(s => s.service);

      if (user.role === 'superadmin' || user.role === 'admin') {
        const adminServices = availableServices.length > 0
          ? availableServices.map(s => s.label_en)
          : (serviceList.length > 0 ? serviceList : CATEGORIES);
        setMyServices(adminServices);
        setMyRooms([]);
        setMyCounters(activeCounters.length > 0 ? activeCounters : [1, 2, 3, 4, 5]);
        setAccessStatus('assigned');
        return;
      }

      setMyServices(serviceList);
      setMyRooms((rooms ?? []) as RoomAccess[]);
      setAccessStatus(serviceList.length > 0 ? 'assigned' : 'unassigned');
      setMyCounters((counters ?? []).map(c => c.counter).filter(n => activeCounters.includes(n)));
    } catch (err) {
      console.error('useMyAccess: Unexpected exception while verifying access', err);
      setAccessStatus('error');
    }
  }, []);

  return { myServices, myRooms, myCounters, accessStatus, fetchMyAccess, allServices };
}

export default useMyAccess;