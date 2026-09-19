'use client';
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

export function useIdlePatients() {
  const [idlePatients, setIdlePatients] = useState<Patient[]>([]);

  const fetchIdlePatients = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('status', 'Idle')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('idle_at', { ascending: false });

    if (!error && data) setIdlePatients(data);
  }, []);

  const activatePatient = useCallback(async (patient: Patient) => {
    const { data: maxRow } = await supabase
      .from('patients')
      .select('queue_position')
      .order('queue_position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (maxRow?.queue_position ?? 0) + 1;
    setIdlePatients(prev => prev.filter(p => p.id !== patient.id));

    await supabase
      .from('patients')
      .update({
        status: 'Waiting',
        queue_position: nextPosition,
        rotation_count: 0,
        cubicleNum: null,
        counter: null,
        reg_start: null,
        reg_end: null,
        called_at: null,
        progress_started_at: null,
        cubicle_top_started_at: null,
        counter_top_started_at: null,
        counter_rejoin_at: null,
        cooldown_until: null,
        idle_at: null,
      })
      .eq('id', patient.id);
  }, []);

    const removePatient = useCallback(async (patient: Patient) => {
    setIdlePatients(prev => prev.filter(p => p.id !== patient.id));

    const { error } = await supabase
        .from('patients')
        .update({ status: 'Removed', removed_at: new Date().toISOString() })
        .eq('id', patient.id);

    if (error) {
        console.error('Failed to remove idle patient:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        });
        setIdlePatients(prev => [...prev, patient]);
    }
    }, []);

  return { idlePatients, fetchIdlePatients, activatePatient, removePatient };
}