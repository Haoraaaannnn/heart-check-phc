/**
 * @fileoverview Registration Counter Automated Patient Rotation Hook.
 *
 * Periodically inspects patients stationed at registration counters and rotates
 * top patients whose elapsed intake duration exceeds the configured rotation timeout
 * (default: 3 minutes). Rotated patients are re-queued with updated rejoin timestamps
 * or escalated to Idle status if maximum rotation threshold is exceeded.
 *
 * Security & Reliability Considerations:
 * - Uses optimistic concurrency expected fields via callRotateApi.
 * - Protects historical research datasets via API-level is_historical filtering.
 * - Avoids timer restart churn by maintaining patient state references in a React ref.
 *
 * @module app/transfer/hooks/useRegistrationRotate
 */

'use client';

import { useEffect, useRef } from 'react';
import { Patient } from '@/types/Types';
import { callRotateApi } from '@/app/transfer/lib/rotateApi';

/**
 * Periodically detects timed-out top patients at registration counters and dispatches rotation mutations.
 *
 * @param registrationPatients - Array of current patients assigned to registration counters.
 * @param onRotated - Callback function to refresh workstation data after successful rotation (e.g. syncNow).
 * @param busyRef - Mutable ref tracking in-flight rotation operations to prevent race conditions.
 * @param rotateTimeoutMs - Configured timeout in milliseconds before a counter patient is rotated.
 * @param maxRotations - Maximum allowed rotations before patient is moved to the Idle pool.
 * @param confirmingRef - Optional mutable ref indicating an active confirmation modal.
 * @remarks Polls on a 5-second interval and dispatches atomic batch updates to /api/rotate.
 */
export function useRegistrationRotate(
  registrationPatients: Patient[],
  onRotated: () => Promise<void>,
  busyRef: React.MutableRefObject<boolean>,
  rotateTimeoutMs: number,
  maxRotations: number,
  confirmingRef?: React.MutableRefObject<boolean>
) {
  const registrationRef = useRef<Patient[]>(registrationPatients);

  useEffect(() => {
    registrationRef.current = registrationPatients;
  }, [registrationPatients]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;
      if (confirmingRef?.current) return;

      const now = Date.now();
      const sortKey = (p: Patient) =>
        new Date(p.counter_rejoin_at || p.created_at || 0).getTime();

      const byCounter = new Map<number, Patient[]>();
      for (const p of registrationRef.current) {
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

      console.log(
        '[registration-rotate] FIRING - rotating',
        timedOutTops.length,
        'patient(s):',
        timedOutTops.map(p => ({
          patientNum: p.patientNum,
          counter: p.counter,
          elapsedMs: now - new Date(p.counter_top_started_at!).getTime(),
          thresholdMs: rotateTimeoutMs,
        }))
      );

      busyRef.current = true;
      try {
        const nowIso = new Date().toISOString();

        const updates = timedOutTops.map(p => {
          const nextCount = (p.rotation_count ?? 0) + 1;
          if (nextCount >= maxRotations) {
            return {
              id: p.id,
              expected: { counter: p.counter },
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
            expected: { counter: p.counter },
            rotation_count: nextCount,
            counter_rejoin_at: nowIso,
            counter_top_started_at: null,
          };
        });

        await callRotateApi(updates);
        await onRotated();
        console.log('[registration-rotate] Rotation mutation successfully completed');
      } catch (err) {
        console.error('[registration-rotate] Rotation error:', err);
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onRotated, busyRef, rotateTimeoutMs, maxRotations, confirmingRef]);
}