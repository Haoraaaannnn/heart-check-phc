/** @fileoverview Shared staff station-break state with realtime updates and polling recovery. */
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StationOwner } from '@/types/StationOwnership';

/** Station availability returned by the role-scoped staff endpoint. */
export interface StaffStation {
  kind: 'counter' | 'cubicle';
  id: number;
  label: string;
  onBreak: boolean;
  active: boolean;
  owners?: StationOwner[];
}

/** @param value - Untrusted owner label. @returns Whether username and identity flag are valid. */
function isOwner(value: unknown): value is StationOwner {
  return typeof value === 'object' && value !== null && 'username' in value && 'isCurrentUser' in value &&
    typeof value.username === 'string' && value.username.trim().length > 0 && typeof value.isCurrentUser === 'boolean';
}

/** @param value - Untrusted station response. @returns Whether the station is safe to render and control. */
function isStation(value: unknown): value is StaffStation {
  if (typeof value !== 'object' || value === null) return false;
  return 'kind' in value && (value.kind === 'counter' || value.kind === 'cubicle') &&
    'id' in value && typeof value.id === 'number' && Number.isSafeInteger(value.id) && value.id > 0 &&
    'label' in value && typeof value.label === 'string' &&
    'onBreak' in value && typeof value.onBreak === 'boolean' && 'active' in value && typeof value.active === 'boolean' &&
    'owners' in value && Array.isArray(value.owners) && value.owners.every(isOwner);
}

/**
 * Loads only stations staff may manage and persists break toggles without optimistic success.
 * @returns Authorized stations, busy/error state, and an authenticated toggle action.
 */
export function useStationBreaks() {
  const [stations, setStations] = useState<StaffStation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const mutating = useRef(false);
  const sequence = useRef(0);
  const mounted = useRef(false);
  const reading = useRef(false);

  /** Calls the break endpoint with the current session token. */
  const request = useCallback(async (body?: StaffStation): Promise<{ kind: 'stations'; stations: StaffStation[] } | { kind: 'saved' }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in again.');
    const response = await fetch('/api/station-breaks', {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify({ kind: body.kind, id: body.id, onBreak: !body.onBreak }) } : {}),
    });
    const json: unknown = await response.json();
    if (typeof json !== 'object' || json === null) throw new Error('Invalid station response.');
    if (!response.ok) throw new Error('error' in json && typeof json.error === 'string' ? json.error : 'Unable to update break status.');
    if (body) {
      if (!('success' in json) || json.success !== true) throw new Error('Station update was not confirmed.');
      return { kind: 'saved' };
    }
    if (!('stations' in json) || !Array.isArray(json.stations) || !json.stations.every(isStation)) throw new Error('Unable to verify station ownership.');
    return { kind: 'stations', stations: json.stations };
  }, []);

  /** Refreshes break state while ignoring outdated responses. */
  const refresh = useCallback(async () => {
    if (reading.current) return;
    reading.current = true;
    const id = ++sequence.current;
    try {
      const json = await request();
      if (json.kind !== 'stations') throw new Error('Invalid station response.');
      if (mounted.current && id === sequence.current) { setStations(json.stations); setError(''); }
    } catch (err) {
      if (mounted.current && id === sequence.current) setError(err instanceof Error ? err.message : 'Unable to load break controls.');
    } finally { reading.current = false; }
  }, [request]);

  useEffect(() => {
    mounted.current = true;
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), 5000);
    const channel = supabase.channel('staff-station-breaks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cubicle' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_counters' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_cubicles' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => void refresh()).subscribe();
    return () => { mounted.current = false; clearTimeout(initial); clearInterval(timer); void supabase.removeChannel(channel); };
  }, [refresh]);

  /** Saves a station's next break state and reloads the authoritative result. */
  const toggle = async (station: StaffStation) => {
    if (mutating.current) return;
    mutating.current = true;
    setBusy(`${station.kind}:${station.id}`);
    setError('');
    try {
      await request(station);
      ++sequence.current;
      if (mounted.current) setStations(previous => previous.map(item => item.kind === station.kind && item.id === station.id
        ? { ...item, onBreak: !station.onBreak } : item));
      await refresh();
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update break status.'); }
    finally { mutating.current = false; setBusy(null); }
  };
  return { stations, busy, error, toggle };
}
