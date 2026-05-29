'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Cubicle } from '@/types/Types';

export function useCubicleData() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);

  const fetchCubicles = async () => {
    const { data, error } = await supabase.from('cubicle').select('*').order('id', { ascending: true });
    if (!error && data) setCubicles(data);
  };

  return { cubicles, setCubicles, fetchCubicles };
}