'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Cubicle } from '@/types/Types';

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

  const fetchCubicles = useCallback(async () => {
    const { data, error } = await supabase
      .from('cubicle')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setCubicles(data as Cubicle[]);

      const doctorIds = [
        ...new Set((data as Cubicle[]).map(c => c.doctorId).filter(Boolean)),
      ] as string[];

      if (doctorIds.length === 0) {
        setCubicleDoctorMap({});
        return;
      }

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, full_name')
        .in('id', doctorIds);

      const typedDoctors = (doctorsData || []) as DoctorNameRow[];
      const nameById = new Map(typedDoctors.map(d => [d.id, d.full_name]));
      const map: Record<string, string> = {};

      (data as Cubicle[]).forEach(c => {
        if (c.doctorId && nameById.has(c.doctorId)) {
          map[c.cubicleNum] = nameById.get(c.doctorId)!;
        }
      });

      setCubicleDoctorMap(map);
    }
  }, []);

  return { cubicles, setCubicles, fetchCubicles, cubicleDoctorMap };
}

export default useCubicleData;