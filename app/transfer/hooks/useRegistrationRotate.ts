/**
 * @fileoverview Registration Counter Automated Patient Rotation Hook.
 *
 * Periodically inspects patients stationed at registration counters and rotates
 * top patients whose elapsed intake duration exceeds the configured rotation timeout
 * (default: 3 minutes). Rotated patients are re-queued with updated rejoin timestamps
 * or moved to recoverable idle status at the configured rotation limit.
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
import { callRotateApi, RotationConflictError } from '@/app/transfer/lib/rotateApi';
import { fetchActiveCounters } from '@/lib/counters';
import { nextIdleRotation, idlePatientFields } from '@/lib/idleRotationPolicy';

/** Inputs for registration intake rotation with mutation guards. */
interface RegistrationRotateOptions {
  registrationPatients: Patient[];
  onRotated: () => Promise<void>;
  busyRef: React.MutableRefObject<boolean>;
  rotateTimeoutMs: number;
  maxRotations: number;
  confirmingRef?: React.MutableRefObject<boolean>;
}

/**
 * Periodically detects timed-out top patients at registration counters and dispatches rotation mutations.
 *
 * @param options - Registration queue, timeout interval and mutation guards.
 * @remarks Polls on a 5-second interval and dispatches atomic batch updates to /api/rotate.
 */
export function useRegistrationRotate({ registrationPatients, onRotated, busyRef,
  rotateTimeoutMs, maxRotations, confirmingRef }: RegistrationRotateOptions) {
  const registrationRef = useRef<Patient[]>(registrationPatients);

  useEffect(() => {
    registrationRef.current = registrationPatients;
  }, [registrationPatients]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (busyRef.current) return;
      if (confirmingRef?.current) return;
      busyRef.current = true;
      try {
        const availableCounters = new Set(await fetchActiveCounters());

        const now = Date.now();
        const sortKey = (p: Patient) =>
          new Date(p.counter_rejoin_at || p.created_at || 0).getTime();

        const byCounter = new Map<number, Patient[]>();
        for (const p of registrationRef.current) {
          if (!p.counter || !availableCounters.has(p.counter)) continue;
          const patients = byCounter.get(p.counter) ?? [];
          patients.push(p);
          byCounter.set(p.counter, patients);
        }

        const timedOutTops: Patient[] = [];
        for (const [, patients] of byCounter) {
          const top = [...patients].sort((a, b) => sortKey(a) - sortKey(b))[0];
          if (
            top?.counter_top_started_at &&
            !top.counter_paused_at &&
            now - new Date(top.counter_top_started_at).getTime() >= rotateTimeoutMs
          ) {
            timedOutTops.push(top);
          }
        }

        if (timedOutTops.length === 0) return;

        const nowIso = new Date().toISOString();

        const updates = timedOutTops.map(p => {
          const rotation = nextIdleRotation({ rotationCount: p.rotation_count, maxRotations });
          const nextCount = rotation.rotationCount;
          const expected = { counter: p.counter, status: p.status, rotation_count: p.rotation_count ?? null,
            counter_paused_at: null, counter_top_started_at: p.counter_top_started_at };
          if (rotation.idle) {
            return {
              id: p.id,
              expected,
              ...idlePatientFields(nowIso),
              rotation_count: nextCount,
            };
          }
          return {
            id: p.id,
            expected,
            rotation_count: nextCount,
            counter_rejoin_at: nowIso,
            counter_top_started_at: null,
          };
        });

        await callRotateApi(updates);
        await onRotated();
        console.log('[registration-rotate] Rotation mutation successfully completed');
      } catch (err: unknown) {
        await onRotated().catch(() => console.error('[registration-rotate] Unable to refresh counter tickets.'));
        if (!(err instanceof RotationConflictError)) {
          console.error('[registration-rotate] Update failed:', err instanceof Error ? err.message : 'Counter update unavailable.');
        }
      } finally {
        busyRef.current = false;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onRotated, busyRef, rotateTimeoutMs, maxRotations, confirmingRef]);
}
