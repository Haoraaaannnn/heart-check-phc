/**
 * @fileoverview Reusable React hook for discovering and updating staff station assignments
 * (single Counter or Cubicle) and multi-service subscriptions via /api/workstation/station-claim.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Full TypeScript typing with zero unvalidated assertions
 * - Solid surface styling integration
 * - Zero emojis in comments or UI
 *
 * @module hooks/useStationClaim
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/** Available counter descriptor with live occupancy. */
export interface AvailableCounter {
  counter_number: number;
  label: string;
  on_break: boolean;
  occupiedBy: { userId: number; username: string } | null;
}

/** Available cubicle descriptor with live occupancy. */
export interface AvailableCubicle {
  id: number;
  cubicleNum: string;
  category: string | null;
  room: number | null;
  subcategory: string | null;
  doctorId: string | null;
  on_break: boolean;
  occupiedBy: { userId: number; username: string } | null;
}

/** Hospital service definition. */
export interface StationServiceOption {
  id: number;
  label_en: string;
  requires_nurse: boolean | null;
  requires_registration: boolean | null;
}

/** Caller's current saved station assignment. */
export interface CurrentStationAssignment {
  counter: number | null;
  cubicleId: number | null;
  services: string[];
}

/** Return contract for useStationClaim. */
export interface UseStationClaimReturn {
  loading: boolean;
  saving: boolean;
  error: string | null;
  assignment: CurrentStationAssignment;
  counters: AvailableCounter[];
  cubicles: AvailableCubicle[];
  services: StationServiceOption[];
  refresh: () => Promise<void>;
  claimStation: (params: {
    workstation: 'registration' | 'nurse';
    counter?: number;
    cubicleId?: number;
    services: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
  removeStationClaim: (workstation?: 'registration' | 'nurse') => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Hook to manage station claims and service checklists.
 *
 * @returns State and functions to read and update station configuration.
 */
export function useStationClaim(): UseStationClaimReturn {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<CurrentStationAssignment>({
    counter: null,
    cubicleId: null,
    services: [],
  });
  const [counters, setCounters] = useState<AvailableCounter[]>([]);
  const [cubicles, setCubicles] = useState<AvailableCubicle[]>([]);
  const [services, setServices] = useState<StationServiceOption[]>([]);

  const mountedRef = useRef<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (mountedRef.current) setLoading(false);
        return;
      }

      const res = await fetch('/api/workstation/station-claim', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to load station assignments.');
      }

      const data = await res.json();
      if (!mountedRef.current) return;

      setAssignment(data.currentAssignment || { counter: null, cubicleId: null, services: [] });
      setCounters(data.counters || []);
      setCubicles(data.cubicles || []);
      setServices(data.services || []);
      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unable to load station metadata.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const claimStation = useCallback(
    async (params: {
      workstation: 'registration' | 'nurse';
      counter?: number;
      cubicleId?: number;
      services: string[];
    }): Promise<{ ok: boolean; error?: string }> => {
      setSaving(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Authentication session expired. Please log in again.');
        }

        const res = await fetch('/api/workstation/station-claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(params),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || 'Failed to update station assignment.');
        }

        if (mountedRef.current) {
          if (params.workstation === 'registration') {
            setAssignment((prev) => ({
              ...prev,
              counter: params.counter ?? null,
              services: params.services,
            }));
          } else {
            setAssignment((prev) => ({
              ...prev,
              cubicleId: params.cubicleId ?? null,
              services: params.services,
            }));
          }
        }

        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to save station assignment.';
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    },
    []
  );

  const removeStationClaim = useCallback(
    async (workstation?: 'registration' | 'nurse'): Promise<{ ok: boolean; error?: string }> => {
      setSaving(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Authentication session expired. Please log in again.');
        }

        const url = workstation
          ? `/api/workstation/station-claim?workstation=${encodeURIComponent(workstation)}`
          : '/api/workstation/station-claim';

        const res = await fetch(url, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.error || 'Failed to remove station configuration.');
        }

        if (mountedRef.current) {
          if (workstation === 'registration') {
            setAssignment((prev) => ({
              ...prev,
              counter: null,
              services: [],
            }));
          } else if (workstation === 'nurse') {
            setAssignment((prev) => ({
              ...prev,
              cubicleId: null,
              services: [],
            }));
          } else {
            setAssignment({
              counter: null,
              cubicleId: null,
              services: [],
            });
          }
        }

        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to remove station assignment.';
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    },
    []
  );

  return {
    loading,
    saving,
    error,
    assignment,
    counters,
    cubicles,
    services,
    refresh,
    claimStation,
    removeStationClaim,
  };
}

