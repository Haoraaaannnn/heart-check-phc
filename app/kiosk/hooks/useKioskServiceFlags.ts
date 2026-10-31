/** @fileoverview Minimal service routing metadata with stale-response protection and retryable errors. */
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseDoctorSelectionService } from '@/app/kiosk/lib/doctorSelection';

/** Runtime-validated capabilities used after the age selection step. */
interface ServiceFlags { label_en: string; requires_cubicle: boolean }

const serviceFlagsCache = new Map<string, ServiceFlags>();

/**
 * Prevents rapid category taps from guessing a route before service metadata arrives.
 * Caches validated capabilities in memory for instant subsequent loads.
 * @param serviceId - Selected service from the kiosk URL.
 * @returns Current capabilities, loading state, and a retry action on failure.
 */
export function useKioskServiceFlags(serviceId: string | null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ id: string | null; service: ServiceFlags | null; error: string | null } | null>(() => {
    if (serviceId && serviceFlagsCache.has(serviceId)) {
      return { id: serviceId, service: serviceFlagsCache.get(serviceId)!, error: null };
    }
    return null;
  });
  useEffect(() => {
    const controller = new AbortController();
    /** @returns Resolves capabilities without retaining another service's stale routing state. */
    async function load() {
      try {
        if (!serviceId || !/^[1-9]\d*$/.test(serviceId)) throw new Error('Invalid service');
        if (serviceFlagsCache.has(serviceId)) {
          const cached = serviceFlagsCache.get(serviceId)!;
          if (!controller.signal.aborted) setResult({ id: serviceId, service: cached, error: null });
          return;
        }
        const response = await createClient().from('services').select('label_en,requires_cubicle')
          .eq('id', serviceId).abortSignal(controller.signal).maybeSingle();
        const service = parseDoctorSelectionService(response.data);
        if (response.error || !service) throw new Error('Service unavailable');
        serviceFlagsCache.set(serviceId, service);
        if (!controller.signal.aborted) setResult({ id: serviceId, service, error: null });
      } catch {
        if (!controller.signal.aborted) setResult({ id: serviceId, service: null, error: 'Unable to load the service. Please try again.' });
      }
    }
    void load();
    return () => controller.abort();
  }, [serviceId, revision]);
  const current = result?.id === serviceId ? result : null;
  return { service: current?.service ?? null, error: current?.error ?? null, loading: !current,
    retry: () => { setResult(null); setRevision(value => value + 1); } };
}
