/** @fileoverview Persists morning/afternoon rollover while a transfer workstation is open. */
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** @returns Visible synchronization error; the database also enforces the shift at each rotation. */
export function useQueueShift() {
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let busy = false;
    /** @returns Completion after a server-authorized idempotent rollover. */
    async function synchronize() {
      if (busy) return;
      busy = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const response = await fetch('/api/queue-shift', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!response.ok) throw new Error('Queue shift synchronization failed. Please retry or contact the superadmin.');
        if (!disposed) setError('');
      } catch (failure: unknown) {
        if (!disposed) setError(failure instanceof Error ? failure.message : 'Queue shift synchronization failed.');
      } finally { busy = false; }
    }
    void synchronize();
    const intervalMs = 5000;
    const timer = setInterval(() => void synchronize(), intervalMs);
    return () => { disposed = true; clearInterval(timer); };
  }, []);
  return error;
}
