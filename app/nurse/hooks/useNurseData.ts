/**
 * @fileoverview Hook managing real-time data fetching, cubicle scoping, access control,
 * and optimistic in-flight mutation pinning for the Nurse Dashboard.
 *
 * Implements Superadmin and Admin bypass parity with the Transfer Dashboard
 * while defaulting to owned stations and restricting shared viewing to the OPD Screening service.
 *
 * Weak-Signal Stabilization Features:
 * - In-flight mutation pinning: Prevents optimistic state transitions from being reverted
 *   by lagging server query responses during weak connectivity.
 * - Monotonic request sequencing: Discards delayed out-of-order network responses.
 * - Cached cubicle discovery: Avoids repeating 4 authorization and metadata queries on
 *   every real-time or polling tick.
 * - 0ms In-memory realtime patching: Updates patient positions immediately upon receiving
 *   Supabase Realtime payloads without waiting for background HTTP round trips.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 *
 * @module app/nurse/hooks/useNurseData
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { parseNurseStations, isOpdScreeningService } from '@/app/nurse/lib/stationView';
import {
  getCachedServices,
  getCachedDoctorsMap,
} from '@/lib/cache/facilityMetadataCache';
import {
  AssignedNurseCubicle,
  ClinicalStage,
  stageToDbStatus,
  dbStatusToStage,
} from '@/app/nurse/types/nurse';

/**
 * Cubicle assignment status descriptor.
 */
export type AssignmentStatus = 'loading' | 'assigned' | 'unassigned' | 'error';

/**
 * Pinned in-flight mutation descriptor ensuring local transitions are not
 * overwritten by stale server polling responses.
 */
interface InFlightPin {
  stage: ClinicalStage;
  expiresAt: number;
}

/**
 * Return model for the useNurseData hook.
 */
export interface UseNurseDataReturn {
  assignedPatients: Patient[];
  withDoctorPatients: Patient[];
  carryoutPatients: Patient[];
  finishedPatients: Patient[];
  assignmentStatus: AssignmentStatus;
  assignedCubicleNums: string[];
  assignedCubicles: AssignedNurseCubicle[];
  stationDirectory: AssignedNurseCubicle[];
  assignedServices: string[];
  setAssignedPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setWithDoctorPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setCarryoutPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setFinishedPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  fetchData: () => Promise<void>;
  fetchFinished: () => Promise<void>;
  refreshCubicles: () => Promise<string[]>;
  pinInFlightMutation: (patientId: number, targetStage: ClinicalStage) => void;
  unpinMutation: (patientId: number) => void;
  applyRealtimeUpdate: (payload: any) => void;
}

/**
 * Hook to retrieve and maintain patient rosters across clinical stages for assigned cubicles.
 *
 * @param options - Explicit shared OPD Screening view; clinical permissions remain server-verified.
 * @returns State models, setters, and synchronizing fetch callbacks.
 */
export function useNurseData({ showAllScreening = false }: { showAllScreening?: boolean } = {}): UseNurseDataReturn {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [withDoctorPatients, setWithDoctorPatients] = useState<Patient[]>([]);
  const [carryoutPatients, setCarryoutPatients] = useState<Patient[]>([]);
  const [finishedPatients, setFinishedPatients] = useState<Patient[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('loading');
  const [assignedCubicleNums, setAssignedCubicleNums] = useState<string[]>([]);
  const [assignedCubicles, setAssignedCubicles] = useState<AssignedNurseCubicle[]>([]);
  const [stationDirectory, setStationDirectory] = useState<AssignedNurseCubicle[]>([]);
  const [assignedServices, setAssignedServices] = useState<string[]>([]);

  // Cached cubicle and service discovery to avoid redundant SQL queries on every poll tick
  const cachedCubicleNumsRef = useRef<string[]>([]);
  const cachedCubiclesRef = useRef<AssignedNurseCubicle[]>([]);
  const cachedAssignedServicesRef = useRef<string[]>([]);
  const cachedRegServicesRef = useRef<Set<string>>(new Set());
  const userRoleRef = useRef<string>('');

  // Monotonic sequence guards to discard stale out-of-order network responses
  const fetchSeqRef = useRef<number>(0);
  const finishedSeqRef = useRef<number>(0);
  const showAllScreeningRef = useRef(showAllScreening);
  useEffect(() => {
    showAllScreeningRef.current = showAllScreening;
    fetchSeqRef.current += 1;
    finishedSeqRef.current += 1;
  }, [showAllScreening]);

  // In-flight mutation map to prevent optimistic state from jumping backward
  const inFlightMutationsRef = useRef<Map<number, InFlightPin>>(new Map());
  const inFlightFetchRef = useRef<Promise<void> | null>(null);

  /**
   * Pins an active mutation so subsequent background server fetches do not
   * revert the patient to an older clinical stage before the write commits.
   *
   * @param patientId - Database identifier of the patient.
   * @param targetStage - Target clinical stage to lock locally.
   */
  const pinInFlightMutation = useCallback((patientId: number, targetStage: ClinicalStage) => {
    inFlightMutationsRef.current.set(patientId, {
      stage: targetStage,
      expiresAt: Date.now() + 5_000, // 5-second safety pin
    });
  }, []);

  /**
   * Unpins an active mutation upon verified database error or confirmation.
   *
   * @param patientId - Database identifier of the patient.
   */
  const unpinMutation = useCallback((patientId: number) => {
    inFlightMutationsRef.current.delete(patientId);
  }, []);

  /**
   * Discovers and retrieves cubicles and services assigned to the active user,
   * keeping the cached discovery list restricted to owned cubicles for every staff role.
   *
   * @param forceRefresh - If true, bypasses the local cache and queries the database.
   */
  const getMyCubicleNums = useCallback(async (forceRefresh = false): Promise<string[]> => {
    if (!forceRefresh && (cachedCubicleNumsRef.current.length > 0 || cachedAssignedServicesRef.current.length > 0)) {
      return cachedCubicleNumsRef.current;
    }

    if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
      setAssignmentStatus('loading');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
        setAssignmentStatus('error');
      }
      return cachedCubicleNumsRef.current;
    }

    // Identify user profile by auth_id first, then fallback to email
    let user: { id: string | number; role?: string } | null = null;

    const { data: userByAuth } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', session.user.id)
      .maybeSingle();

    if (userByAuth) {
      user = userByAuth;
    } else if (session.user.email) {
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', session.user.email)
        .maybeSingle();

      if (userByEmail) {
        user = userByEmail;
      }
    }

    if (!user) {
      if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
        setAssignmentStatus('error');
      }
      return cachedCubicleNumsRef.current;
    }

    userRoleRef.current = user.role || '';
    let cubiclesToFetch: AssignedNurseCubicle[] = [];
    let finalServices: string[] = [];

    // Query assigned user_cubicles, user_services, and active hospital services concurrently
    const [
      { data: links, error: linkError },
      { data: userServices, error: serviceError },
      allServices,
    ] = await Promise.all([
      supabase.from('user_cubicles').select('cubicle_id').eq('user_id', user.id),
      supabase.from('user_services').select('service').eq('user_id', user.id),
      getCachedServices(supabase),
    ]);

    const regServices = (allServices || [])
      .filter((s) => s.requires_registration !== false)
      .map((s) => s.label_en.trim().toLowerCase());
    cachedRegServicesRef.current = new Set(regServices);

    const cubicleIds = (links ?? []).map((link) => link.cubicle_id).filter(Boolean);
    const assignedServiceNames = (userServices ?? []).map((s) => s.service).filter(Boolean);
    const hasExplicitCubicle = cubicleIds.length > 0;

    const activeNurseServices = (allServices || [])
      .filter((s) => s.requires_nurse !== false)
      .map((s) => s.label_en)
      .filter(Boolean);

    // Accounts without explicit claims retain an empty owned list; the server handles the separate global view.
    if ((user.role === 'superadmin' || user.role === 'admin') && !hasExplicitCubicle) {
      const { data: allCubicles, error: cubicleError } = await supabase
        .from('cubicle')
        .select('id, cubicleNum, category, room, subcategory, doctorId')
        .in('id', cubicleIds)
        .order('room', { ascending: true })
        .order('cubicleNum', { ascending: true });

      if (cubicleError) {
        console.error('Failed to load cubicles for admin:', cubicleError);
        if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      cubiclesToFetch = (allCubicles || []) as AssignedNurseCubicle[];
      finalServices = Array.from(
        new Set([
          ...activeNurseServices,
          ...cubiclesToFetch.map((c) => c.category).filter(Boolean),
        ])
      );
    } else {
      if (linkError || serviceError) {
        console.error('Failed to load user assignments:', { linkError, serviceError });
        if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      const effectiveServices =
        assignedServiceNames.length > 0 ? assignedServiceNames : activeNurseServices;

      // Strict 1-to-1 cubicle enforcement: If nurse has claimed a cubicle, fetch ONLY that cubicle
      if (hasExplicitCubicle) {
        const { data: explicitCubicles } = await supabase
          .from('cubicle')
          .select('id, cubicleNum, category, room, subcategory, doctorId')
          .in('id', cubicleIds);
        cubiclesToFetch = (explicitCubicles || []) as AssignedNurseCubicle[];
      } else if (effectiveServices.length > 0) {
        // Service permission alone never expands the owned-station list.
        const { data: categoryCubicles } = await supabase
          .from('cubicle')
          .select('id, cubicleNum, category, room, subcategory, doctorId')
          .in('id', cubicleIds);
        cubiclesToFetch = (categoryCubicles || []) as AssignedNurseCubicle[];
      }

      cubiclesToFetch.sort(
        (a, b) =>
          (a.room ?? 0) - (b.room ?? 0) ||
          String(a.cubicleNum).localeCompare(String(b.cubicleNum))
      );

      finalServices = Array.from(
        new Set([
          ...effectiveServices,
          ...cubiclesToFetch.map((c) => c.category).filter(Boolean),
        ])
      );
    }

    // Attach doctor name metadata if doctorId is present
    const doctorMap = await getCachedDoctorsMap(supabase);
    cubiclesToFetch = cubiclesToFetch.map((c) => ({
      ...c,
      doctorName: c.doctorId ? doctorMap[c.doctorId] || null : null,
    }));

    const cubicleNums = cubiclesToFetch.map((cubicle) => cubicle.cubicleNum);

    cachedCubiclesRef.current = cubiclesToFetch;
    cachedCubicleNumsRef.current = cubicleNums;
    cachedAssignedServicesRef.current = finalServices;
    setAssignedCubicles(cubiclesToFetch);
    setAssignedCubicleNums(cubicleNums);
    setAssignedServices(finalServices);
    setAssignmentStatus((cubicleNums.length > 0 || finalServices.length > 0) ? 'assigned' : 'unassigned');

    return cubicleNums;
  }, []);

  /**
   * Explicitly reloads cubicle assignments from the database.
   */
  const refreshCubicles = useCallback(async (): Promise<string[]> => {
    return getMyCubicleNums(true);
  }, [getMyCubicleNums]);

  // Load cubicle assignments once on initial mount if not yet populated
  useEffect(() => {
    if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
      void getMyCubicleNums(false);
    }
  }, [getMyCubicleNums]);

  /**
   * Fetches active patients currently progressing through cubicle stages today.
   * Overlays active in-flight mutations to prevent UI jumping. Coalesces concurrent in-flight calls.
   */
  const fetchData = useCallback(async () => {
    if (inFlightFetchRef.current) return inFlightFetchRef.current;

    const task = (async () => {
      const requestId = ++fetchSeqRef.current;
      const requestedAllScreening = showAllScreeningRef.current;
      const cubicleNums = await getMyCubicleNums(false);
      const myServices = cachedAssignedServicesRef.current;
      const isSupervisor = userRoleRef.current === 'superadmin' || userRoleRef.current === 'admin';

      let rawPatients: Patient[] = [];
      let serverApiSucceeded = false;

      // 1. Primary: Server API fetch (uses service-role to avoid client RLS null-cubicle drops)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(requestedAllScreening ? '/api/nurse/patients?scope=opd-screening' : '/api/nurse/patients', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (response.ok) {
            const json = await response.json();
            if (requestId !== fetchSeqRef.current || requestedAllScreening !== showAllScreeningRef.current) return;
            rawPatients = (json.patients || []) as Patient[];
            if (json.finishedPatients) {
              setFinishedPatients((json.finishedPatients || []) as Patient[]);
            }
            if (Array.isArray(json.effectiveServices)) {
              cachedAssignedServicesRef.current = json.effectiveServices;
              setAssignedServices(json.effectiveServices);
            }
            if (Array.isArray(json.cubicles)) {
              const ownedStations = parseNurseStations(json.cubicles);
              const visibleStations = parseNurseStations(json.viewCubicles ?? json.cubicles);
              cachedCubiclesRef.current = ownedStations;
              cachedCubicleNumsRef.current = ownedStations.map(station => station.cubicleNum);
              setAssignedCubicles(ownedStations);
              setAssignedCubicleNums(cachedCubicleNumsRef.current);
              setStationDirectory(visibleStations);
              setAssignmentStatus(ownedStations.length > 0 ? 'assigned' : 'unassigned');
            }
            serverApiSucceeded = true;
          }
        }
      } catch (apiErr) {
        console.warn('Nurse server API fetch failed, falling back to direct client queries:', apiErr);
      }

      // 2. Fallback: Direct client query if server API was unreachable
      if (!serverApiSucceeded) {
        if (requestedAllScreening) throw new Error('OPD Screening patients could not be loaded. Please retry.');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (isSupervisor && cubicleNums.length === 0) {
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .in('status', ['Assigned', 'With Doctor', 'Carryout'])
            .not('cubicleNum', 'is', null)
            .in('cubicleNum', cubicleNums)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .order('created_at', { ascending: true });

          if (error) {
            console.warn('Nurse background fetch dropped:', error.message);
            return;
          }
          rawPatients = ((data || []) as Patient[]).filter((p) => {
            if (!p.cubicleNum) return false;
            const svc = p.service?.trim().toLowerCase() || '';
            if (cachedRegServicesRef.current.has(svc) && !p.reg_end) return false;
            return true;
          });
        } else {
          const queries = [];
          if (cubicleNums.length > 0) {
            queries.push(
              supabase
                .from('patients')
                .select('*')
                .in('status', ['Assigned', 'With Doctor', 'Carryout'])
                .not('cubicleNum', 'is', null)
                .in('cubicleNum', cubicleNums)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: true })
            );
          }
          if (cubicleNums.length === 0 && myServices.length > 0) {
            queries.push(
              supabase
                .from('patients')
                .select('*')
                .in('status', ['Assigned', 'With Doctor', 'Carryout'])
                .not('cubicleNum', 'is', null)
                .in('cubicleNum', cubicleNums)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: true })
            );
          }

          const results = await Promise.all(queries);
          const patientMap = new Map<number, Patient>();
          for (const res of results) {
            if (!res.error && res.data) {
              for (const p of res.data) {
                if (!p.cubicleNum) continue;
                const svc = p.service?.trim().toLowerCase() || '';
                if (cachedRegServicesRef.current.has(svc) && !p.reg_end) continue;
                patientMap.set(p.id, p as Patient);
              }
            } else if (res.error) {
              console.warn('Nurse background fetch subquery error:', res.error.message);
            }
          }

          rawPatients = Array.from(patientMap.values()).sort(
            (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          );
        }
      }

      // Discard response if a newer fetch was initiated in the meantime
      if (requestId !== fetchSeqRef.current) {
        return;
      }

      // Clean up expired in-flight mutation pins
      const now = Date.now();
      for (const [id, pin] of inFlightMutationsRef.current.entries()) {
        if (now > pin.expiresAt) {
          inFlightMutationsRef.current.delete(id);
        }
      }

      // Overlay active pins onto server data so slow writes never revert local state
      const processedData = rawPatients.map((patient) => {
        const pin = inFlightMutationsRef.current.get(patient.id);
        if (pin) {
          if (dbStatusToStage(patient.status) === pin.stage) {
            inFlightMutationsRef.current.delete(patient.id);
          } else {
            return { ...patient, status: stageToDbStatus(pin.stage) };
          }
        }
        return patient;
      });

      setAssignedPatients(
        processedData.filter((p) => dbStatusToStage(p.status) === 'assigned')
      );
      setWithDoctorPatients(
        processedData.filter((p) => dbStatusToStage(p.status) === 'with_doctor')
      );
      setCarryoutPatients(
        processedData.filter((p) => dbStatusToStage(p.status) === 'carryout')
      );
    })();

    inFlightFetchRef.current = task;
    try {
      await task;
    } finally {
      if (inFlightFetchRef.current === task) {
        inFlightFetchRef.current = null;
      }
    }
  }, [getMyCubicleNums]);

  /**
   * Fetches completed patients archived in the daily ledger today.
   * Leverages the unified server API response in fetchData to avoid redundant duplicate queries.
   */
  const fetchFinished = useCallback(async () => {
    return fetchData();
  }, [fetchData]);

  /**
   * Directly patches incoming Supabase Realtime payloads into local state in 0ms,
   * completely eliminating wait delays and preventing column jumpiness.
   */
  const applyRealtimeUpdate = useCallback((payload: any) => {
    const eventType = payload.eventType;
    const newRow = payload.new as Patient | undefined;
    const oldRow = payload.old as { id: number } | undefined;

    if (!newRow && !oldRow) return;

    if (eventType === 'DELETE' && oldRow?.id) {
      const deletedId = oldRow.id;
      setAssignedPatients((prev) => prev.filter((p) => p.id !== deletedId));
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== deletedId));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== deletedId));
      return;
    }

    if (!newRow) return;

    const patient = newRow;
    const myCubicles = cachedCubicleNumsRef.current;
    // Clinical workstation constraint: patient must have an assigned cubicle
    if (!patient.cubicleNum) {
      setAssignedPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== patient.id));
      return;
    }

    // If service requires registration, intake must be completed before appearing on nurse board
    const serviceName = patient.service?.trim().toLowerCase() || '';
    if (cachedRegServicesRef.current.has(serviceName) && !patient.reg_end) {
      setAssignedPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== patient.id));
      return;
    }

    const screeningAllowed = cachedCubiclesRef.current.some(station => isOpdScreeningService(station.category));
    const belongsToMe = showAllScreeningRef.current
      ? screeningAllowed && isOpdScreeningService(patient.service)
      : myCubicles.includes(patient.cubicleNum);

    // If active pin exists and server status caught up, unpin
    const pin = inFlightMutationsRef.current.get(patient.id);
    if (pin && dbStatusToStage(patient.status) === pin.stage) {
      inFlightMutationsRef.current.delete(patient.id);
    }
    const effectiveStage: ClinicalStage | null = pin
      ? pin.stage
      : dbStatusToStage(patient.status);
    const effectiveStatus = effectiveStage
      ? stageToDbStatus(effectiveStage)
      : patient.status;

    if (!belongsToMe || effectiveStage === 'done' || !effectiveStage) {
      setAssignedPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== patient.id));
      return;
    }

    const updatedPatient: Patient = { ...patient, status: effectiveStatus };

    if (effectiveStage === 'assigned') {
      setAssignedPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === updatedPatient.id);
        return idx >= 0 ? prev.map((p, i) => (i === idx ? updatedPatient : p)) : [...prev, updatedPatient];
      });
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
    } else if (effectiveStage === 'with_doctor') {
      setWithDoctorPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === updatedPatient.id);
        return idx >= 0 ? prev.map((p, i) => (i === idx ? updatedPatient : p)) : [...prev, updatedPatient];
      });
      setAssignedPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
    } else if (effectiveStage === 'carryout') {
      setCarryoutPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === updatedPatient.id);
        return idx >= 0 ? prev.map((p, i) => (i === idx ? updatedPatient : p)) : [...prev, updatedPatient];
      });
      setAssignedPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
    }
  }, []);

  return {
    assignedPatients,
    withDoctorPatients,
    carryoutPatients,
    finishedPatients,
    assignmentStatus,
    assignedCubicleNums,
    assignedCubicles,
    stationDirectory,
    assignedServices,
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    setFinishedPatients,
    fetchData,
    fetchFinished,
    refreshCubicles,
    pinInFlightMutation,
    unpinMutation,
    applyRealtimeUpdate,
  };
}

export default useNurseData;
