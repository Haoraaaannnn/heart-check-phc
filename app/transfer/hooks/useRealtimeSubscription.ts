'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeSubscription(onFetch: () => void) {
  const onFetchRef = useRef(onFetch);

  useEffect(() => {
    onFetchRef.current = onFetch;
  }, [onFetch]);

  useEffect(() => {
    const channel = supabase.channel('patients-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        console.log('Real-time update detected, refreshing data...');
        onFetchRef.current();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []); 
}