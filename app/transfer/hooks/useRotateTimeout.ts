'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

export function useRotateTimeout() {
  const [rotateTimeoutMs, setRotateTimeoutMs] = useState<number>(DEFAULT_TIMEOUT_MS);

  const fetchTimeout = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'rotate_timeout_seconds')
      .single();

    console.log('[rotate-timeout] fetched:', { data, error });

    if (!error && data) {
      const seconds = parseInt(data.value, 10);
      console.log('[rotate-timeout] parsed seconds:', seconds, '→ ms:', seconds * 1000);
      if (!isNaN(seconds) && seconds > 0) {
        setRotateTimeoutMs(seconds * 1000);
      }
    }
  }, []);

  useEffect(() => {
    fetchTimeout();

    const channel = supabase
      .channel('app-settings-rotate-timeout')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.rotate_timeout_seconds' },
        () => {
          console.log('[rotate-timeout] realtime change detected, refetching...');
          fetchTimeout();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTimeout]);

  return rotateTimeoutMs;
}