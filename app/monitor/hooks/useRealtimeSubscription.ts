'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeSubscription(channelName: string, category: string, onFetch: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'patients',
        filter: `service=eq.${category}`
      }, () => {
        onFetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelName, category, onFetch]);
}