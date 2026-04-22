'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Cubicle } from '../types';

export function useCubicleData() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);

  const fetchCubicles = async () => {
    const { data, error } = await supabase.from('cubicle').select('*').order('id', { ascending: true });
    if (!error && data) setCubicles(data);
  };

  return { cubicles, setCubicles, fetchCubicles };
}