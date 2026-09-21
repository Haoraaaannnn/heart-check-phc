'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export type RoomAccess = { service: string; subcategory: string | null; room: number };
type AccessStatus = 'loading' | 'assigned' | 'unassigned' | 'error';

export function useMyAccess() {
  const [myServices, setMyServices] = useState<string[]>([]);
  const [myRooms, setMyRooms] = useState<RoomAccess[]>([]);
  const [myCounters, setMyCounters] = useState<number[]>([]);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');

  const fetchMyAccess = async () => {
    setAccessStatus('loading');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAccessStatus('error'); return; }

    const { data: user, error: userError } = await supabase
      .from('users').select('id').eq('auth_id', session.user.id).single();

    if (userError || !user) { setAccessStatus('error'); return; }

    const [{ data: services, error: e1 }, { data: rooms, error: e2 }, { data: counters, error: e3 }] =
      await Promise.all([
        supabase.from('user_services').select('service').eq('user_id', user.id),
        supabase.from('user_rooms').select('service, subcategory, room').eq('user_id', user.id),
        supabase.from('user_counters').select('counter').eq('user_id', user.id),
      ]);

    if (e1 || e2 || e3) { setAccessStatus('error'); return; }

    const serviceList = (services ?? []).map(s => s.service);
    setMyServices(serviceList);
    setMyRooms((rooms ?? []) as RoomAccess[]);
    setMyCounters((counters ?? []).map(c => c.counter));
    setAccessStatus(serviceList.length > 0 ? 'assigned' : 'unassigned');
  };

  return { myServices, myRooms, myCounters, accessStatus, fetchMyAccess };
}