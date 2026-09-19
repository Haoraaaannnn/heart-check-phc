'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_MAX_ROTATIONS = 5;

export function useMaxRotations() {
  const [maxRotations, setMaxRotations] = useState<number>(DEFAULT_MAX_ROTATIONS);

  const fetchMaxRotations = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'max_rotations_before_idle')
      .single();

    if (!error && data) {
      const count = parseInt(data.value, 10);
      if (!isNaN(count) && count > 0) {
        setMaxRotations(count);
      }
    }
  }, []);

  useEffect(() => {
    fetchMaxRotations();

    const channel = supabase
      .channel('app-settings-max-rotations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.max_rotations_before_idle' },
        () => fetchMaxRotations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMaxRotations]);

  return maxRotations;
}