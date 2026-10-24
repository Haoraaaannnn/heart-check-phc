/** @fileoverview Destination-scoped manual calls with deduplication and reconnect recovery. */
'use client';
import { useEffect, useRef } from 'react';

/** Public call payload; contains no patient names, contact details, or internal identifiers. */
export interface MonitorCall {
  id: number; ticket: string; message: string; counter: number | null; cubicle: string | null; expiresAt: string;
}

/**
 * Polls for calls after monitor activation and queues each received event exactly once locally.
 * @param service - The monitor's department, or Registration.
 * @param subcategory - Optional Adult/Pedia monitor subdivision.
 * @param enabled - True only after the user presses Start Monitor.
 * @param onCall - Adds a call to the monitor's existing serialized audio queue.
 * @returns Nothing; cleans up pending requests when stopped or rerouted.
 */
export function useMonitorCalls(service: string, subcategory: string | null, enabled: boolean, onCall: (call: MonitorCall) => void) {
  const callback = useRef(onCall);
  useEffect(() => { callback.current = onCall; }, [onCall]);
  useEffect(() => {
    if (!enabled) return;
    let cursor: number | null = null;
    let busy = false;
    let disposed = false;
    const controller = new AbortController();
    /** Retries transient failures with the same cursor so received calls are not lost. */
    const poll = async () => {
      if (busy || disposed) return;
      busy = true;
      try {
        const params = new URLSearchParams({ service });
        if (subcategory) params.set('subcategory', subcategory);
        if (cursor !== null) params.set('after', String(cursor));
        const response = await fetch(`/api/monitor-calls?${params}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const result = await response.json();
        if (disposed) return;
        for (const call of result.calls as MonitorCall[]) callback.current(call);
        cursor = result.cursor;
      } catch { /* Keep the cursor and retry while this monitor remains active. */ }
      finally { busy = false; }
    };
    void poll();
    const timer = setInterval(() => void poll(), 1500);
    return () => { disposed = true; controller.abort(); clearInterval(timer); };
  }, [service, subcategory, enabled]);
}
