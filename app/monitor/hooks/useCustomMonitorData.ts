/**
 * @fileoverview Hook for multi-service custom monitor display data and announcement serialization.
 *
 * Supports monitoring any arbitrary combination of hospital clinical services and
 * registration intake counters on a single public waiting room TV monitor.
 * Serializes manual and automatic speech calls across services without audio collisions.
 *
 * @module app/monitor/hooks/useCustomMonitorData
 */

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient, Cubicle } from '@/types/Types';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';
import { useMonitorCalls, MonitorCall } from './useMonitorCalls';
import { playMonitorSpeech } from '../lib/playMonitorSpeech';
import { sortCubiclePatients } from '../lib/sortCubiclePatients';
import { fetchActiveCounters } from '@/lib/counters';

/** Uniform station definition combining intake counters and clinical cubicles. */
export interface CustomStation {
  id: string;
  type: 'counter' | 'cubicle';
  service: string;
  subcategory?: string | null;
  stationNumber: number | string;
  label: string;
  doctorName?: string | null;
  servingPatient: Patient | null;
  waitingPatients: Patient[];
  isExtendedIntake: boolean;
  isCalling: boolean;
}

/** Active serving patient entry for a service queue. */
export interface ServingEntry {
  ticket: string;
  stationLabel: string;
  doctorName?: string | null;
  isCalling: boolean;
  isExtended: boolean;
}

/** Discrete monitor target queue configuration. */
export interface NormalizedMonitorTarget {
  key: string;
  service: string;
  subcategory: string | null;
  displayTitle: string;
  displaySubcategory: string | null;
}

const SERVICES_WITH_SUBCATEGORIES = new Set(['Consultation', 'OPD Screening']);

/**
 * Normalizes user-selected services and isolates subcategories (Pedia vs Adult).
 * Ensures that services with age cohorts are never mixed together on the display.
 * @param rawServices - Array of selected service strings from UI or URL query.
 * @returns Array of normalized targets with isolated services and subcategories.
 */
export function normalizeMonitorTargets(rawServices: string[]): NormalizedMonitorTarget[] {
  const targets: NormalizedMonitorTarget[] = [];
  const seenKeys = new Set<string>();

  for (const raw of rawServices) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const dashMatch = trimmed.match(/^([^-]+)\s*-\s*([^-]+)$/);
    if (dashMatch) {
      const base = dashMatch[1].trim();
      const sub = dashMatch[2].trim();
      const key = `${base}-${sub}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        targets.push({
          key,
          service: base,
          subcategory: sub,
          displayTitle: base,
          displaySubcategory: sub,
        });
      }
      continue;
    }

    if (SERVICES_WITH_SUBCATEGORIES.has(trimmed)) {
      for (const sub of ['Pedia', 'Adult']) {
        const key = `${trimmed}-${sub}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          targets.push({
            key,
            service: trimmed,
            subcategory: sub,
            displayTitle: trimmed,
            displaySubcategory: sub,
          });
        }
      }
      continue;
    }

    if (!seenKeys.has(trimmed)) {
      seenKeys.add(trimmed);
      targets.push({
        key: trimmed,
        service: trimmed,
        subcategory: null,
        displayTitle: trimmed,
        displaySubcategory: null,
      });
    }
  }

  return targets;
}

/** Aggregated service queue combining all stations under one clinical department. */
export interface CustomServiceQueue {
  id: string;
  service: string;
  subcategory?: string | null;
  displayTitle: string;
  displaySubcategory?: string | null;
  openStationCount: number;
  openStationSummary: string;
  primaryServing: ServingEntry | null;
  otherServing: ServingEntry[];
  waitingQueue: Patient[];
  totalWaitingCount: number;
  isCalling: boolean;
}

/** Active call state tracked on the monitor screen. */
export interface ActiveCallState {
  ticket: string;
  counter?: number | null;
  cubicle?: string | null;
  expiry: number;
}

/** Announcement queue item for serialized speech playback. */
interface QueueItem {
  message: string;
  ticket: string;
  counter?: number | null;
  cubicle?: string | null;
  expiresAt?: string;
}

/**
 * Checks whether an active patient intake transaction exceeds 5 minutes.
 * @param patient - Current patient record.
 * @param currentMs - Current timestamp in milliseconds.
 * @returns True if elapsed duration exceeds 5 minutes.
 */
function isExtendedTransaction(patient: Patient | null, currentMs: number): boolean {
  if (!patient) return false;
  const startTime = patient.reg_start || patient.called_at || patient.progress_started_at || patient.created_at;
  if (!startTime) return false;
  const startMs = new Date(startTime).getTime();
  if (isNaN(startMs)) return false;
  return (currentMs - startMs) > 5 * 60 * 1000;
}

/**
 * Hook to manage data fetching, real-time sync, and speech dispatch for custom multi-service monitors.
 * @param services - Array of service names selected for this monitor.
 * @param started - True if the staff user has activated the monitor screen.
 * @returns Roster of stations, active call state, current time, and refresh callback.
 */
export function useCustomMonitorData(services: string[], started: boolean) {
  const [stations, setStations] = useState<CustomStation[]>([]);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentMs, setCurrentMs] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);

  const announcementQueue = useRef<QueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const audioController = useRef<AbortController | null>(null);
  const announcedPatients = useRef<Map<string, Set<number>>>(new Map());

  // Reset audio controller and announcement queue on unmount or services change
  useEffect(() => {
    if (!started) return;
    const controller = new AbortController();
    audioController.current = controller;
    const announced = announcedPatients.current;
    return () => {
      controller.abort();
      announcementQueue.current = [];
      announced.clear();
    };
  }, [started, services]);

  // Tick clock and expire active call highlights
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentMs(now);
      setCurrentTime(new Date(now));
      setActiveCall(prev => {
        if (!prev) return null;
        return now < prev.expiry ? prev : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /** Serializes manual staff calls and automatic intake announcements without audio collisions. */
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || !audioController.current || audioController.current.signal.aborted) return;
    const controller = audioController.current;
    isPlayingRef.current = true;
    try {
      while (announcementQueue.current.length && !controller.signal.aborted) {
        const item = announcementQueue.current.shift()!;
        if (item.expiresAt && Date.parse(item.expiresAt) <= Date.now()) continue;

        setActiveCall({
          ticket: item.ticket,
          counter: item.counter,
          cubicle: item.cubicle,
          expiry: Date.now() + 15000,
        });

        try {
          await playMonitorSpeech(item.message, 2, controller.signal);
        } catch (error) {
          if (!controller.signal.aborted) {
            console.warn('Custom monitor speech playback failed:', error);
          }
        }
      }
    } finally {
      isPlayingRef.current = false;
      if (announcementQueue.current.length && audioController.current !== controller) {
        void processQueue();
      }
    }
  }, []);

  const normalizedTargets = useMemo(() => normalizeMonitorTargets(services), [services]);

  const pollParam = useMemo(() => {
    return normalizedTargets.map(t => t.subcategory ? `${t.service}-${t.subcategory}` : t.service).join(',');
  }, [normalizedTargets]);

  // Poll for destination-scoped calls across all selected services and subcategories
  useMonitorCalls(pollParam, null, started, (call: MonitorCall) => {
    setActiveCall({
      ticket: call.ticket,
      counter: call.counter,
      cubicle: call.cubicle,
      expiry: Date.now() + 15000,
    });
    announcementQueue.current.push({
      message: call.message,
      ticket: call.ticket,
      counter: call.counter,
      cubicle: call.cubicle,
      expiresAt: call.expiresAt,
    });
    void processQueue();
  });

  /** Fetches all active stations and patient queues for the selected services. */
  const fetchAllData = useCallback(async () => {
    if (normalizedTargets.length === 0) {
      setStations([]);
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const hasRegistration = normalizedTargets.some(t => t.service === 'Registration');
    const clinicalServices = [...new Set(normalizedTargets.filter(t => t.service !== 'Registration').map(t => t.service))];

    const resultStations: CustomStation[] = [];

    // 1. Process Registration Counters if selected
    if (hasRegistration) {
      const activeCounters = await fetchActiveCounters();
      const { data: regPatients } = await supabase
        .from('patients')
        .select('*')
        .eq('service', 'Registration')
        .in('status', ['On Progress', 'Waiting'])
        .not('counter', 'is', null)
        .is('reg_end', null)
        .eq('is_historical', false)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('counter', { ascending: true })
        .order('created_at', { ascending: true });

      const patientList = regPatients || [];
      for (const counterNum of activeCounters) {
        const counterPatients = patientList.filter(p => p.counter === counterNum);
        const serving = counterPatients[0] || null;
        const waiting = counterPatients.slice(1);
        const stationId = `counter-${counterNum}`;

        resultStations.push({
          id: stationId,
          type: 'counter',
          service: 'Registration',
          stationNumber: counterNum,
          label: `Counter ${counterNum}`,
          servingPatient: serving,
          waitingPatients: waiting,
          isExtendedIntake: isExtendedTransaction(serving, Date.now()),
          isCalling: false, // will be evaluated dynamically with activeCall
        });
      }
    }

    // 2. Process Clinical Services (Cubicles & Rooms)
    if (clinicalServices.length > 0) {
      const { data: cubicleData } = await supabase
        .from('cubicle')
        .select('*')
        .in('category', clinicalServices)
        .eq('on_break', false)
        .order('room', { ascending: true })
        .order('cubicleNum', { ascending: true });

      const cubicles: Cubicle[] = cubicleData || [];
      const doctorIds = [...new Set(cubicles.map(c => c.doctorId).filter(Boolean))] as string[];

      let doctorNameMap: Record<string, string> = {};
      if (doctorIds.length > 0) {
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('id, full_name')
          .in('id', doctorIds);
        if (doctorsData) {
          doctorNameMap = Object.fromEntries(doctorsData.map(d => [d.id, d.full_name]));
        }
      }

      const { data: clinicalPatients } = await supabase
        .from('patients')
        .select('*')
        .in('service', clinicalServices)
        .in('status', ['Assigned', 'With Doctor', 'Carryout'])
        .not('cubicleNum', 'is', null)
        .eq('is_historical', false)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('called_at', { ascending: true });

      const cPatients: Patient[] = clinicalPatients || [];

      for (const cubicle of cubicles) {
        const cubiclePatients = sortCubiclePatients(
          cPatients.filter(p => p.cubicleNum === cubicle.cubicleNum)
        );
        const serving = cubiclePatients[0] || null;
        const waiting = cubiclePatients.slice(1);
        const doctorName = cubicle.doctorId ? doctorNameMap[cubicle.doctorId] : null;
        const stationId = `cubicle-${cubicle.cubicleNum}`;

        resultStations.push({
          id: stationId,
          type: 'cubicle',
          service: cubicle.category,
          subcategory: cubicle.subcategory || null,
          stationNumber: cubicle.cubicleNum,
          label: cubicle.cubicleNum,
          doctorName,
          servingPatient: serving,
          waitingPatients: waiting,
          isExtendedIntake: isExtendedTransaction(serving, Date.now()),
          isCalling: false,
        });
      }
    }

    setStations(resultStations);
    setLoading(false);
  }, [normalizedTargets]);

  // Initial fetch and polling loop
  useEffect(() => {
    void fetchAllData();
    const interval = setInterval(() => {
      void fetchAllData();
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Realtime postgres changes subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('custom-monitor-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        void fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cubicle' }, () => {
        void fetchAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, () => {
        void fetchAllData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // Determine active calling state per station
  const stationsWithCalling = stations.map(station => {
    const isCalling = activeCall !== null && currentMs < activeCall.expiry && (
      (station.type === 'counter' && activeCall.counter === station.stationNumber) ||
      (station.type === 'cubicle' && activeCall.cubicle === station.stationNumber) ||
      (station.servingPatient !== null && activeCall.ticket === station.servingPatient.patientNum)
    );
    return {
      ...station,
      isCalling,
      isExtendedIntake: isExtendedTransaction(station.servingPatient, currentMs),
    };
  });

  // Aggregate stations into vertically stackable separated service queues
  const serviceQueues: CustomServiceQueue[] = normalizedTargets.map(target => {
    const serviceStations = stationsWithCalling.filter(station => {
      if (target.service === 'Registration') {
        return station.type === 'counter' && station.service === 'Registration';
      }
      if (station.service !== target.service) return false;
      if (target.subcategory) {
        return (station.subcategory ?? '').toLowerCase() === target.subcategory.toLowerCase();
      }
      return true;
    });

    const openStationCount = serviceStations.length;
    const openStationSummary = target.service === 'Registration'
      ? `${openStationCount} ${openStationCount === 1 ? 'Counter' : 'Counters'} Open`
      : `${openStationCount} ${openStationCount === 1 ? 'Cubicle' : 'Cubicles'} Open`;

    const allServing: ServingEntry[] = serviceStations
      .filter(s => s.servingPatient !== null)
      .map(s => ({
        ticket: s.servingPatient!.patientNum,
        stationLabel: s.label,
        doctorName: s.doctorName,
        isCalling: s.isCalling,
        isExtended: s.isExtendedIntake,
      }));

    // Prioritize actively calling station as primary serving card
    const callingEntry = allServing.find(e => e.isCalling);
    const primaryServing = callingEntry || allServing[0] || null;
    const otherServing = allServing.filter(e => e !== primaryServing);

    // Deduplicate and order waiting queue for this service and subcategory
    const seenIds = new Set<number>();
    const waitingQueue: Patient[] = [];
    for (const station of serviceStations) {
      for (const p of station.waitingPatients) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          waitingQueue.push(p);
        }
      }
    }
    waitingQueue.sort((a, b) => {
      if (a.queue_position != null && b.queue_position != null) return a.queue_position - b.queue_position;
      return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
    });

    const isCalling = serviceStations.some(s => s.isCalling) || (primaryServing?.isCalling ?? false);

    return {
      id: target.key,
      service: target.service,
      subcategory: target.subcategory,
      displayTitle: target.displayTitle,
      displaySubcategory: target.displaySubcategory,
      openStationCount,
      openStationSummary,
      primaryServing,
      otherServing,
      waitingQueue,
      totalWaitingCount: waitingQueue.length,
      isCalling,
    };
  });

  return {
    stations: stationsWithCalling,
    serviceQueues,
    activeCall,
    currentTime,
    loading,
    refresh: fetchAllData,
  };
}
