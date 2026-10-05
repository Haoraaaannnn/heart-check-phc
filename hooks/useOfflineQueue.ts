/**
 * @fileoverview Custom React hook coordinating offline outbox state, persistence, and synchronization.
 *
 * Provides real-time synchronization tracking between client-side IndexedDB mutations
 * and the remote Supabase database.
 *
 * Implements:
 * - Automatic queue depth tracking via outbox subscription.
 * - Automatic startup queue flushing upon component mount to recover unsynced actions
 *   from prior power outages, browser crashes, or disconnected sessions.
 * - Automatic sync trigger when the browser returns online (`online` event listener).
 * - Periodic background flush attempts when unsynced items are pending.
 * - Non-intrusive status flags (`isSyncing`, `pendingCount`, `lastSyncResult`).
 *
 * Adheres strictly to AGENTS.md rules with full JSDoc and zero emojis.
 *
 * @module hooks/useOfflineQueue
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeOutboxCount,
  flushMutationQueue,
  enqueueMutation,
  EnqueueMutationParams,
  PendingMutation,
  FlushResult,
  getPendingCount,
} from '@/lib/offlineQueue';

/**
 * Return interface for the `useOfflineQueue` hook.
 */
export interface UseOfflineQueueReturn {
  /** Total number of mutations currently waiting in local storage to be pushed to Supabase. */
  pendingCount: number;
  /** True while a background flush operation is actively sending mutations to Supabase. */
  isSyncing: boolean;
  /** Result metadata from the most recent queue flush execution, or null if unrun. */
  lastSyncResult: FlushResult | null;
  /** Enqueues a new mutation to non-volatile disk storage. */
  enqueue: (params: EnqueueMutationParams) => Promise<PendingMutation>;
  /** Manually initiates an immediate FIFO flush of all pending mutations to Supabase. */
  flush: () => Promise<FlushResult>;
}

/**
 * React hook providing offline outbox persistence and automatic synchronization.
 *
 * @param onSynced - Optional callback invoked after a queue flush successfully pushes items.
 * @returns Hook state indicators and mutation dispatch functions.
 */
export function useOfflineQueue(onSynced?: () => void | Promise<void>): UseOfflineQueueReturn {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<FlushResult | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const onSyncedRef = useRef(onSynced);

  useEffect(() => {
    onSyncedRef.current = onSynced;
  }, [onSynced]);

  /**
   * Executes a flush pass with loading state management.
   */
  const flush = useCallback(async (): Promise<FlushResult> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const count = await getPendingCount();
      return { processed: 0, errors: 0, remaining: count };
    }

    setIsSyncing(true);
    try {
      const result = await flushMutationQueue();
      if (isMountedRef.current) {
        setLastSyncResult(result);
        setPendingCount(result.remaining);
      }

      if (result.processed > 0 && onSyncedRef.current) {
        try {
          await onSyncedRef.current();
        } catch (callbackErr) {
          console.error('Error in onSynced callback after queue flush:', callbackErr);
        }
      }

      return result;
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, []);

  /**
   * Enqueues a mutation into local storage and triggers an immediate sync attempt.
   */
  const enqueue = useCallback(
    async (params: EnqueueMutationParams): Promise<PendingMutation> => {
      const item = await enqueueMutation(params);
      // Attempt immediate background sync if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void flush();
      }
      return item;
    },
    [flush]
  );

  // Subscribe to outbox depth changes
  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = subscribeOutboxCount((count) => {
      if (isMountedRef.current) {
        setPendingCount(count);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // Flush on initial mount (recovers data from sudden power loss or reboots)
  useEffect(() => {
    void flush();
  }, [flush]);

  // Flush when browser connection returns online
  useEffect(() => {
    const handleOnline = () => {
      void flush();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [flush]);

  // Periodic retry interval (every 20 seconds if pending items remain)
  useEffect(() => {
    if (pendingCount === 0) return;

    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void flush();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [pendingCount, flush]);

  return {
    pendingCount,
    isSyncing,
    lastSyncResult,
    enqueue,
    flush,
  };
}

export default useOfflineQueue;
