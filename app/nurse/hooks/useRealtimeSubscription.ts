/**
 * @fileoverview Debounced Supabase Realtime channel subscription for the Nurse Dashboard.
 *
 * Listens for postgres changes on the 'patients' table and triggers a debounced
 * re-fetch callback to coalesce rapid batch transitions without overwhelming the network.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Subscribes to real-time changes on the patients table with a debounce threshold.
 *
 * @param onFetch - Callback function invoked when updates occur.
 * @param debounceMs - Milliseconds to debounce incoming change events (defaults to 300ms).
 */
export function useRealtimeSubscription(onFetch: () => void, debounceMs: number = 300): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFetchRef = useRef(onFetch);

  // Keep latest callback ref without re-triggering subscription effect
  useEffect(() => {
    onFetchRef.current = onFetch;
  }, [onFetch]);

  useEffect(() => {
    const handleUpdate = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onFetchRef.current();
      }, debounceMs);
    };

    const channel = supabase
      .channel('patients-nurse-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [debounceMs]);
}

export default useRealtimeSubscription;