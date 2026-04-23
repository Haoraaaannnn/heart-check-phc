'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeSubscription(categoryParam: string, onFetch: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`patients-queue-${categoryParam}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        onFetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [categoryParam, onFetch]);
}