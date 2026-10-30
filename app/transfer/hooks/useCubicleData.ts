/** @fileoverview Available transfer cubicles and doctor names with break-state synchronization. */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Cubicle } from '@/types/Types';
import { getCachedDoctorsMap } from '@/lib/cache/facilityMetadataCache';

/**
 * Shape of doctor record returned from Supabase for cubicle mapping.
 */
export interface DoctorNameRow {
  id: string;
  full_name: string;
}

/**
 * Hook for fetching cubicles and mapping each cubicle number to its assigned doctor's name.
 *
 * @returns State containing cubicles list, setter, fetch function, and doctor name dictionary.
 */
export function useCubicleData() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [cubicleDoctorMap, setCubicleDoctorMap] = useState<Record<string, string>>({});

  const fetchCubicles = useCallback(async (failOnError = false) => {
    const { data, error } = await supabase
      .from('cubicle')
      .select('*')
      .eq('on_break', false)
      .order('id', { ascending: true });

    if (failOnError && (error || !data)) throw new Error('Unable to load stations. Please retry.');
    if (!error && data) {
      setCubicles(data as Cubicle[]);

      const doctorNameMap = await getCachedDoctorsMap(supabase);
      const map: Record<string, string> = {};

      (data as Cubicle[]).forEach(c => {
        if (c.doctorId && doctorNameMap[c.doctorId]) {
          map[c.cubicleNum] = doctorNameMap[c.doctorId];
        }
      });

      setCubicleDoctorMap(map);
    }
  }, []);

  useEffect(() => {
    let subscribed = false;
    const timer = setInterval(() => {
      if (!subscribed && document.visibilityState === 'visible') void fetchCubicles();
    }, 5000);
    const onVisible = () => { if (document.visibilityState === 'visible') void fetchCubicles(); };
    document.addEventListener('visibilitychange', onVisible);
    const channel = supabase.channel('transfer-cubicle-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cubicle' }, () => void fetchCubicles())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => void fetchCubicles())
      .subscribe(status => { subscribed = status === 'SUBSCRIBED'; });
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); void supabase.removeChannel(channel); };
  }, [fetchCubicles]);

  return { cubicles, setCubicles, fetchCubicles, cubicleDoctorMap };
}

export default useCubicleData;
