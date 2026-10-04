/**
 * @fileoverview Persistent client-side mutation outbox and synchronization queue.
 *
 * Implements a durable Write-Ahead Logging (WAL) and offline outbox pattern using
 * the browser's native IndexedDB storage.
 *
 * Architectural Purpose:
 * - Guarantees zero data loss when power abruptly dies, workstations reboot,
 *   or hospital WiFi connectivity drops.
 * - Stores mutation requests (table updates, upserts) directly to non-volatile disk
 *   storage before or concurrently with network transmission to Supabase.
 * - Automatically replays (flushes) stored mutations in chronological FIFO order
 *   upon reconnection or after page restart following a blackout.
 * - Preserves clinical timestamps (e.g., consultation start, carryout start) recorded
 *   at the exact moment staff performed the physical action, preventing clock distortion
 *   when syncing hours later.
 *
 * @module lib/offlineQueue
 */

import { supabase } from './supabase';

/**
 * Representation of an individual mutation record stored in the local outbox.
 */
export interface PendingMutation {
  /** Unique UUID or timestamp-keyed identifier for the queued action. */
  id: string;
  /** Name of the target Supabase database table (e.g. 'patients'). */
  table: string;
  /** Operation mutation type: 'update' for single records or 'upsert' for batches. */
  type: 'update' | 'upsert';
  /** Mutation payload containing the updated columns and values. */
  payload: Record<string, unknown> | Array<Record<string, unknown>>;
  /** Key column for matching target rows during updates (e.g. 'id'). */
  matchKey?: string;
  /** Value of the matching key for row identification (e.g. patient ID). */
  matchValue?: string | number;
  /** Exact ISO-8601 timestamp when staff initiated the clinical action. */
  clientTimestamp: string;
  /** Number of failed synchronization attempts encountered. */
  retries: number;
  /** Epoch millisecond timestamp of entry creation for FIFO sequence ordering. */
  createdAt: number;
  /** Human-readable explanation of the action for audit logs and UI feedback. */
  description?: string;
}

/**
 * Parameter structure required to enqueue a new offline mutation.
 */
export type EnqueueMutationParams = Omit<PendingMutation, 'id' | 'createdAt' | 'retries'>;

/**
 * Execution outcome summary after a queue flush run.
 */
export interface FlushResult {
  /** Number of mutations successfully persisted to Supabase and dequeued. */
  processed: number;
  /** Number of mutations that encountered non-retriable or network failures. */
  errors: number;
  /** Remaining queue depth after the flush operation. */
  remaining: number;
}

/** Name of the browser IndexedDB database. */
const DB_NAME = 'phc_offline_cache';
/** Database schema version number. */
const DB_VERSION = 1;
/** Object store holding pending mutation records. */
const STORE_NAME = 'mutation_outbox';

/** Active database connection promise cache. */
let dbPromise: Promise<IDBDatabase> | null = null;

/** Registered queue depth change listener callbacks. */
const queueListeners = new Set<(count: number) => void>();

/** Guard flag preventing concurrent overlapping queue flushes. */
let isFlushInProgress = false;

/**
 * Safely generates a unique UUID string in both modern and legacy browser environments.
 *
 * @returns A unique UUID v4 string.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Resolves or establishes an open connection to the IndexedDB database.
 *
 * @returns A promise resolving to the active IDBDatabase instance.
 * @throws Error if execution environment lacks IndexedDB support (e.g., SSR).
 */
export function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is unavailable in this environment.'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Notifies all registered listeners of the current outbox queue depth.
 */
async function notifyQueueListeners(): Promise<void> {
  try {
    const count = await getPendingCount();
    queueListeners.forEach((listener) => {
      try {
        listener(count);
      } catch (err) {
        console.error('Queue listener error:', err);
      }
    });
  } catch {
    // Suppress notification errors if IndexedDB is inaccessible
  }
}

/**
 * Subscribes a callback to receive real-time outbox item count updates.
 *
 * @param listener - Callback receiving the current pending item count.
 * @returns An unsubscription function to release the listener.
 */
export function subscribeOutboxCount(listener: (count: number) => void): () => void {
  queueListeners.add(listener);
  void getPendingCount().then((count) => listener(count));
  return () => {
    queueListeners.delete(listener);
  };
}

/**
 * Enqueues a clinical mutation into non-volatile disk storage.
 *
 * @param params - Configuration and payload for the mutation.
 * @returns The fully constructed PendingMutation record saved to disk.
 */
export async function enqueueMutation(params: EnqueueMutationParams): Promise<PendingMutation> {
  const db = await getDB();
  const item: PendingMutation = {
    ...params,
    id: generateUUID(),
    createdAt: Date.now(),
    retries: 0,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  void notifyQueueListeners();
  return item;
}

/**
 * Retrieves all pending outbox mutations sorted chronologically (FIFO).
 *
 * @returns Array of pending mutation records waiting for sync.
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  try {
    const db = await getDB();
    return await new Promise<PendingMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const req = index.getAll();

      req.onsuccess = () => resolve((req.result as PendingMutation[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read pending mutations from IndexedDB:', err);
    return [];
  }
}

/**
 * Removes a successfully synchronized mutation from the local outbox.
 *
 * @param id - Unique identifier of the mutation record to remove.
 */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    void notifyQueueListeners();
  } catch (err) {
    console.error(`Failed to remove mutation ${id} from outbox:`, err);
  }
}

/**
 * Retrieves the total count of mutations currently pending synchronization.
 *
 * @returns Total count of unsynced outbox entries.
 */
export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDB();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

/**
 * Clears all pending mutations from the outbox.
 */
export async function clearQueue(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    void notifyQueueListeners();
  } catch (err) {
    console.error('Failed to clear outbox queue:', err);
  }
}

/**
 * Pushes a single mutation record to the remote Supabase database.
 *
 * @param item - Mutation outbox record to process.
 * @returns True if remote persistence succeeded; false on network or database failure.
 */
async function syncMutationToSupabase(item: PendingMutation): Promise<boolean> {
  try {
    if (item.type === 'update') {
      if (!item.matchKey || item.matchValue === undefined) {
        console.error('Outbox update mutation lacks matchKey or matchValue:', item);
        return false;
      }

      let updateQuery = supabase
        .from(item.table)
        .update(item.payload)
        .eq(item.matchKey, item.matchValue);

      if (item.table === 'patients') {
        updateQuery = updateQuery.eq('is_historical', false);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error(`Supabase update error for mutation ${item.id}:`, error.message);
        return false;
      }
      return true;
    }

    if (item.type === 'upsert') {
      const options = item.matchKey ? { onConflict: item.matchKey } : undefined;
      const { error } = await supabase.from(item.table).upsert(item.payload, options);

      if (error) {
        console.error(`Supabase upsert error for mutation ${item.id}:`, error.message);
        return false;
      }
      return true;
    }

    return false;
  } catch (err) {
    console.error(`Network exception pushing mutation ${item.id}:`, err);
    return false;
  }
}

/**
 * Flushes all pending mutations in the outbox in chronological order to Supabase.
 *
 * @remarks
 * Halts processing upon first network failure to preserve sequential dependency (FIFO).
 * Thread-safe: skips execution if a flush is already active.
 *
 * @returns Result summary detailing processed count, errors, and remaining items.
 */
export async function flushMutationQueue(): Promise<FlushResult> {
  if (isFlushInProgress) {
    const count = await getPendingCount();
    return { processed: 0, errors: 0, remaining: count };
  }

  isFlushInProgress = true;
  let processed = 0;
  let errors = 0;

  try {
    const pendingItems = await getPendingMutations();

    for (const item of pendingItems) {
      // Re-verify browser connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        break;
      }

      const success = await syncMutationToSupabase(item);

      if (success) {
        await removeMutation(item.id);
        processed++;
      } else {
        errors++;
        // If network failed, stop to maintain FIFO sequence for dependent operations
        break;
      }
    }
  } finally {
    isFlushInProgress = false;
    void notifyQueueListeners();
  }

  const remaining = await getPendingCount();
  return { processed, errors, remaining };
}
