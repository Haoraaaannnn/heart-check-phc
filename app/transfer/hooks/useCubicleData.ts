'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Cubicle } from '@/types/Types';

export function useCubicleData() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [cubicleDoctorMap, setCubicleDoctorMap] = useState<Record<string, string>>({});

  const fetchCubicles = async () => {
    const { data, error } = await supabase.from('cubicle').select('*').order('id', { ascending: true });
    if (!error && data) {
      setCubicles(data);

      const doctorIds = [...new Set(data.map((c: Cubicle) => c.doctorId).filter(Boolean))] as string[];

      if (doctorIds.length === 0) {
        setCubicleDoctorMap({});
        return;
      }

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, full_name')
        .in('id', doctorIds);

      const nameById = new Map((doctorsData || []).map((d: any) => [d.id, d.full_name]));
      const map: Record<string, string> = {};
      data.forEach((c: Cubicle) => {
        if (c.doctorId && nameById.has(c.doctorId)) {
          map[c.cubicleNum] = nameById.get(c.doctorId)!;
        }
      });
      setCubicleDoctorMap(map);
    }
  };

  return { cubicles, setCubicles, fetchCubicles, cubicleDoctorMap };
}