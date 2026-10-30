/**
 * @fileoverview In-memory cache for customizable hospital configuration metadata.
 *
 * Caches infrequently changing facility entities (services catalog, cubicles, doctors)
 * to eliminate duplicate Supabase cloud round-trips across Kiosk, Nurse, Transfer,
 * and Monitor interfaces.
 *
 * Implements a 3-minute Time-To-Live (TTL) with optional manual invalidation
 * triggered by Superadmin updates.
 *
 * @module lib/cache/facilityMetadataCache
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Service } from '@/types/Services';
import { Cubicle } from '@/types/Types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Type representing either client or server Supabase instances. */
export type AnySupabaseClient = SupabaseClient;

const memoryCache = new Map<string, CacheEntry<unknown>>();

/** Default cache lifespan for customization metadata: 3 minutes. */
const DEFAULT_METADATA_TTL_MS = 180_000;

/**
 * Retrieves the full clinical services catalog from cache or database.
 *
 * @param supabaseClient - Supabase client instance (client or server).
 * @param forceRefresh - If true, bypasses the memory cache and re-queries PostgreSQL.
 * @returns Ordered array of services.
 */
export async function getCachedServices(
  supabaseClient: AnySupabaseClient,
  forceRefresh = false
): Promise<Service[]> {
  initRealtimeCacheInvalidation(supabaseClient);
  const cacheKey = 'services_catalog';
  const cached = memoryCache.get(cacheKey) as CacheEntry<Service[]> | undefined;

  if (!forceRefresh && cached && Date.now() - cached.timestamp < DEFAULT_METADATA_TTL_MS) {
    return cached.data;
  }

  const { data, error } = await supabaseClient
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.warn('[METADATA CACHE] Failed to fetch services from database:', error.message);
    return cached?.data || [];
  }

  const services = (data || []) as unknown as Service[];
  memoryCache.set(cacheKey, { data: services, timestamp: Date.now() });
  return services;
}

/**
 * Resolves a single service by numeric or string ID from the cached services catalog.
 *
 * @param supabaseClient - Supabase client instance.
 * @param serviceId - Numeric or string ID of the service.
 * @param forceRefresh - If true, re-fetches services from the database.
 * @returns The matching service or null if not found.
 */
export async function getCachedServiceById(
  supabaseClient: AnySupabaseClient,
  serviceId: number | string,
  forceRefresh = false
): Promise<Service | null> {
  const numericId = typeof serviceId === 'string' ? parseInt(serviceId, 10) : serviceId;
  if (isNaN(numericId)) return null;

  const services = await getCachedServices(supabaseClient, forceRefresh);
  return services.find((s) => s.id === numericId) ?? null;
}

/**
 * Retrieves physical cubicles with assigned room and doctor metadata.
 *
 * @param supabaseClient - Supabase client instance.
 * @param forceRefresh - If true, bypasses memory cache and re-queries database.
 * @returns Array of cubicle records.
 */
export async function getCachedCubicles(
  supabaseClient: AnySupabaseClient,
  forceRefresh = false
): Promise<Cubicle[]> {
  initRealtimeCacheInvalidation(supabaseClient);
  const cacheKey = 'cubicles_catalog';
  const cached = memoryCache.get(cacheKey) as CacheEntry<Cubicle[]> | undefined;

  if (!forceRefresh && cached && Date.now() - cached.timestamp < DEFAULT_METADATA_TTL_MS) {
    return cached.data;
  }

  const { data, error } = await supabaseClient
    .from('cubicle')
    .select('*')
    .order('room', { ascending: true })
    .order('cubicleNum', { ascending: true });

  if (error) {
    console.warn('[METADATA CACHE] Failed to fetch cubicles from database:', error.message);
    return cached?.data || [];
  }

  const cubicles = (data || []) as unknown as Cubicle[];
  memoryCache.set(cacheKey, { data: cubicles, timestamp: Date.now() });
  return cubicles;
}

/**
 * Retrieves active doctors dictionary mapping doctor ID to full name.
 *
 * @param supabaseClient - Supabase client instance.
 * @param forceRefresh - If true, forces database re-query.
 * @returns Map of doctor ID to full name string.
 */
export async function getCachedDoctorsMap(
  supabaseClient: AnySupabaseClient,
  forceRefresh = false
): Promise<Record<string, string>> {
  initRealtimeCacheInvalidation(supabaseClient);
  const cacheKey = 'doctors_map';
  const cached = memoryCache.get(cacheKey) as CacheEntry<Record<string, string>> | undefined;

  if (!forceRefresh && cached && Date.now() - cached.timestamp < DEFAULT_METADATA_TTL_MS) {
    return cached.data;
  }

  const { data, error } = await supabaseClient
    .from('doctors')
    .select('id, full_name');

  if (error) {
    console.warn('[METADATA CACHE] Failed to fetch doctors from database:', error.message);
    return cached?.data || {};
  }

  const map: Record<string, string> = {};
  for (const doc of (data as unknown as Array<{ id: string | number; full_name?: string | null }>) || []) {
    if (doc.id) {
      map[String(doc.id)] = doc.full_name || '';
    }
  }

  memoryCache.set(cacheKey, { data: map, timestamp: Date.now() });
  return map;
}

let realtimeBound = false;

/**
 * Initializes a Supabase Realtime channel that auto-invalidates cached entries
 * whenever a CREATE, UPDATE, or DELETE (CRUD) occurs on services, cubicles, or doctors.
 *
 * @param supabaseClient - Active Supabase client instance.
 */
export function initRealtimeCacheInvalidation(supabaseClient: AnySupabaseClient) {
  if (realtimeBound || typeof window === 'undefined') return;
  if (typeof supabaseClient?.channel !== 'function') return;

  realtimeBound = true;
  try {
    supabaseClient
      .channel('facility-metadata-realtime-invalidation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        invalidateFacilityMetadataCache('services');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cubicle' }, () => {
        invalidateFacilityMetadataCache('cubicles');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => {
        invalidateFacilityMetadataCache('doctors');
      })
      .subscribe();
  } catch (err) {
    console.warn('[METADATA CACHE] Failed to bind realtime cache invalidator:', err);
  }
}

/**
 * Invalidates specific or all cached facility configuration keys.
 * Call this upon Superadmin additions, updates, or deletions of services/cubicles/counters.
 *
 * @param key - Specific cache category to invalidate, or undefined to clear all.
 */
export function invalidateFacilityMetadataCache(
  key?: 'services' | 'cubicles' | 'doctors'
) {
  if (key === 'services') memoryCache.delete('services_catalog');
  else if (key === 'cubicles') memoryCache.delete('cubicles_catalog');
  else if (key === 'doctors') memoryCache.delete('doctors_map');
  else memoryCache.clear();
}
