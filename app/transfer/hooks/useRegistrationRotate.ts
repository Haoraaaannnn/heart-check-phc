'use client';
import { useEffect } from 'react';
import { Patient } from '@/types/Types';
import { supabase } from '@/lib/supabase';
import { MAX_ROTATIONS_BEFORE_IDLE } from '../lib/constants';

export function useRegistrationRotate(
  registrationPatients: Patient[],
  fetchRegistrationPatients: () => Promise<void>,
  busyRef: React.MutableRefObject<boolean>,
  rotateTimeoutMs: number,
  maxRotations: number
) {
  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;

      const now = Date.now();
      const sortKey = (p: Patient) =>
        new Date(p.counter_rejoin_at || p.created_at || 0).getTime();

      const byCounter = new Map<number, Patient[]>();
      for (const p of registrationPatients) {
        if (!p.counter) continue;
        if (!byCounter.has(p.counter)) byCounter.set(p.counter, []);
        byCounter.get(p.counter)!.push(p);
      }

      const timedOutTops: Patient[] = [];
      for (const [, patients] of byCounter) {
        const top = [...patients].sort((a, b) => sortKey(a) - sortKey(b))[0];
        if (
          top?.counter_top_started_at &&
          now - new Date(top.counter_top_started_at).getTime() >= rotateTimeoutMs
        ) {
          timedOutTops.push(top);
        }
      }

      if (timedOutTops.length === 0) return;

      busyRef.current = true;
      try {
        const nowIso = new Date().toISOString();

        const updates = timedOutTops.map((p) => {
          const nextCount = (p.rotation_count ?? 0) + 1;
          if (nextCount >= maxRotations) {
            return {
              id: p.id,
              status: 'Idle',
              rotation_count: nextCount,
              idle_at: nowIso,
              counter: null,
              counter_top_started_at: null,
              counter_rejoin_at: null,
            };
          }
          return {
            id: p.id,
            rotation_count: nextCount,
            counter_rejoin_at: nowIso,   
            counter_top_started_at: null, 
          };
        });

        await supabase.from('patients').upsert(updates, { onConflict: 'id' });
        await fetchRegistrationPatients();
      } catch (err) {
        console.error('Registration rotate error:', err);
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [registrationPatients, fetchRegistrationPatients, busyRef, rotateTimeoutMs, maxRotations]); 
}