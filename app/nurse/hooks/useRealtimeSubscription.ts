'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeSubscription(onFetch: () => void) {
  useEffect(() => {
    const channel = supabase.channel('patients-nurse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        onFetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [onFetch]);
}