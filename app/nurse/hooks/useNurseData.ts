/**
 * @fileoverview Hook managing real-time data fetching, cubicle scoping, access control,
 * and optimistic in-flight mutation pinning for the Nurse Dashboard.
 *
 * Implements Superadmin and Admin bypass parity with the Transfer Dashboard
 * so supervisors can view and coordinate any nurse station without manual assignment links.
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
 * @returns State models, setters, and synchronizing fetch callbacks.
 */
export function useNurseData(): UseNurseDataReturn {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [withDoctorPatients, setWithDoctorPatients] = useState<Patient[]>([]);
  const [carryoutPatients, setCarryoutPatients] = useState<Patient[]>([]);
  const [finishedPatients, setFinishedPatients] = useState<Patient[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus>('loading');
  const [assignedCubicleNums, setAssignedCubicleNums] = useState<string[]>([]);
  const [assignedCubicles, setAssignedCubicles] = useState<AssignedNurseCubicle[]>([]);
  const [assignedServices, setAssignedServices] = useState<string[]>([]);

  // Cached cubicle and service discovery to avoid redundant SQL queries on every poll tick
  const cachedCubicleNumsRef = useRef<string[]>([]);
  const cachedCubiclesRef = useRef<AssignedNurseCubicle[]>([]);
  const cachedAssignedServicesRef = useRef<string[]>([]);
  const userRoleRef = useRef<string>('');

  // Monotonic sequence guards to discard stale out-of-order network responses
  const fetchSeqRef = useRef<number>(0);
  const finishedSeqRef = useRef<number>(0);

  // In-flight mutation map to prevent optimistic state from jumping backward
  const inFlightMutationsRef = useRef<Map<number, InFlightPin>>(new Map());

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
   * granting full visibility if user has superadmin or admin privileges.
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

    // Superadmin and Admin bypass: full visibility to all hospital cubicles and active services
    if (user.role === 'superadmin' || user.role === 'admin') {
      const [{ data: allCubicles, error: cubicleError }, { data: allServices, error: serviceError }] =
        await Promise.all([
          supabase
            .from('cubicle')
            .select('id, cubicleNum, category, room, subcategory, doctorId')
            .order('room', { ascending: true })
            .order('cubicleNum', { ascending: true }),
          supabase
            .from('services')
            .select('label_en, requires_nurse, display_order')
            .order('display_order', { ascending: true }),
        ]);

      if (cubicleError) {
        console.error('Failed to load cubicles for admin:', cubicleError);
        if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      cubiclesToFetch = (allCubicles || []) as AssignedNurseCubicle[];

      const nurseServices = (allServices || [])
        .filter((s) => s.requires_nurse !== false)
        .map((s) => s.label_en)
        .filter(Boolean);

      finalServices = Array.from(
        new Set([
          ...nurseServices,
          ...cubiclesToFetch.map((c) => c.category).filter(Boolean),
        ])
      );
    } else {
      // Standard clinical nurse: query assigned user_cubicles, user_services, and active hospital services concurrently
      const [
        { data: links, error: linkError },
        { data: userServices, error: serviceError },
        { data: allServices, error: allServicesError },
      ] = await Promise.all([
        supabase
          .from('user_cubicles')
          .select('cubicle_id')
          .eq('user_id', user.id),
        supabase
          .from('user_services')
          .select('service')
          .eq('user_id', user.id),
        supabase
          .from('services')
          .select('label_en, requires_nurse, display_order')
          .order('display_order', { ascending: true }),
      ]);

      if (linkError || serviceError) {
        console.error('Failed to load user assignments:', { linkError, serviceError, allServicesError });
        if (cachedCubicleNumsRef.current.length === 0 && cachedAssignedServicesRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      const cubicleIds = (links ?? []).map((link) => link.cubicle_id).filter(Boolean);
      const assignedServiceNames = (userServices ?? []).map((s) => s.service).filter(Boolean);

      const activeNurseServices = (allServices || [])
        .filter((s) => s.requires_nurse !== false)
        .map((s) => s.label_en)
        .filter(Boolean);

      // If user has explicit user_services assigned, scope to them;
      // otherwise fallback to active hospital services (parity with Transfer Dashboard)
      const effectiveServices =
        assignedServiceNames.length > 0 ? assignedServiceNames : activeNurseServices;

      // Fetch cubicles by explicit IDs and by effective service categories
      const cubiclePromises = [];
      if (cubicleIds.length > 0) {
        cubiclePromises.push(
          supabase
            .from('cubicle')
            .select('id, cubicleNum, category, room, subcategory, doctorId')
            .in('id', cubicleIds)
        );
      }
      if (effectiveServices.length > 0) {
        cubiclePromises.push(
          supabase
            .from('cubicle')
            .select('id, cubicleNum, category, room, subcategory, doctorId')
            .in('category', effectiveServices)
        );
      }

      const results = await Promise.all(cubiclePromises);
      const cubicleMap = new Map<number | string, AssignedNurseCubicle>();
      for (const res of results) {
        if (res.data) {
          for (const c of res.data) {
            cubicleMap.set(c.id, c as AssignedNurseCubicle);
          }
        }
      }

      cubiclesToFetch = Array.from(cubicleMap.values());
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
    const doctorIds = Array.from(
      new Set(cubiclesToFetch.map((c) => c.doctorId).filter(Boolean))
    ) as string[];

    if (doctorIds.length > 0) {
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, full_name')
        .in('id', doctorIds);

      const doctorMap = new Map((doctorsData || []).map((d) => [d.id, d.full_name]));
      cubiclesToFetch = cubiclesToFetch.map((c) => ({
        ...c,
        doctorName: c.doctorId ? doctorMap.get(c.doctorId) || null : null,
      }));
    }

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

  // Load cubicle assignments once on initial mount
  useEffect(() => {
    void getMyCubicleNums(true);
  }, [getMyCubicleNums]);

  /**
   * Fetches active patients currently progressing through cubicle stages today.
   * Overlays active in-flight mutations to prevent UI jumping.
   */
  const fetchData = useCallback(async () => {
    const requestId = ++fetchSeqRef.current;
    const cubicleNums = await getMyCubicleNums(false);
    const myServices = cachedAssignedServicesRef.current;
    const isSupervisor = userRoleRef.current === 'superadmin' || userRoleRef.current === 'admin';

    if (!isSupervisor && cubicleNums.length === 0 && myServices.length === 0) {
      return;
    }

    let rawPatients: Patient[] = [];
    let serverApiSucceeded = false;

    // 1. Primary: Server API fetch (uses service-role to avoid client RLS null-cubicle drops)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/nurse/patients', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const json = await response.json();
          rawPatients = (json.patients || []) as Patient[];
          if (json.finishedPatients) {
            setFinishedPatients((json.finishedPatients || []) as Patient[]);
          }
          if (Array.isArray(json.effectiveServices) && json.effectiveServices.length > 0) {
            cachedAssignedServicesRef.current = json.effectiveServices;
            setAssignedServices(json.effectiveServices);
          }
          if (Array.isArray(json.cubicles) && json.cubicles.length > 0) {
            cachedCubiclesRef.current = json.cubicles;
            cachedCubicleNumsRef.current = json.cubicles.map((c: AssignedNurseCubicle) => c.cubicleNum);
            setAssignedCubicles(json.cubicles);
            setAssignedCubicleNums(json.cubicles.map((c: AssignedNurseCubicle) => c.cubicleNum));
            setAssignmentStatus('assigned');
          }
          serverApiSucceeded = true;
        }
      }
    } catch (apiErr) {
      console.warn('Nurse server API fetch failed, falling back to direct client queries:', apiErr);
    }

    // 2. Fallback: Direct client query if server API was unreachable
    if (!serverApiSucceeded) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (isSupervisor) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .neq('status', 'Done')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Nurse background fetch dropped:', error.message);
          return;
        }
        rawPatients = (data || []) as Patient[];
      } else {
        const queries = [];
        if (cubicleNums.length > 0) {
          queries.push(
            supabase
              .from('patients')
              .select('*')
              .neq('status', 'Done')
              .in('cubicleNum', cubicleNums)
              .gte('created_at', today.toISOString())
              .lt('created_at', tomorrow.toISOString())
              .order('created_at', { ascending: true })
          );
        }
        if (myServices.length > 0) {
          queries.push(
            supabase
              .from('patients')
              .select('*')
              .neq('status', 'Done')
              .in('service', myServices)
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
  }, [getMyCubicleNums]);

  /**
   * Fetches completed patients archived in the daily ledger today.
   */
  const fetchFinished = useCallback(async () => {
    const requestId = ++finishedSeqRef.current;
    const cubicleNums = await getMyCubicleNums(false);
    const myServices = cachedAssignedServicesRef.current;
    const isSupervisor = userRoleRef.current === 'superadmin' || userRoleRef.current === 'admin';

    if (!isSupervisor && cubicleNums.length === 0 && myServices.length === 0) {
      return;
    }

    let rawFinished: Patient[] = [];
    let serverApiSucceeded = false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/nurse/patients', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const json = await response.json();
          if (json.finishedPatients) {
            rawFinished = (json.finishedPatients || []) as Patient[];
            serverApiSucceeded = true;
          }
        }
      }
    } catch (apiErr) {
      console.warn('Nurse server API finished fetch failed, falling back to direct client queries:', apiErr);
    }

    if (!serverApiSucceeded) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (isSupervisor) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('status', 'Done')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Nurse finished fetch dropped:', error.message);
          return;
        }
        rawFinished = (data || []) as Patient[];
      } else {
        const queries = [];
        if (cubicleNums.length > 0) {
          queries.push(
            supabase
              .from('patients')
              .select('*')
              .eq('status', 'Done')
              .in('cubicleNum', cubicleNums)
              .gte('created_at', today.toISOString())
              .lt('created_at', tomorrow.toISOString())
              .order('updated_at', { ascending: false })
          );
        }
        if (myServices.length > 0) {
          queries.push(
            supabase
              .from('patients')
              .select('*')
              .eq('status', 'Done')
              .in('service', myServices)
              .gte('created_at', today.toISOString())
              .lt('created_at', tomorrow.toISOString())
              .order('updated_at', { ascending: false })
          );
        }

        const results = await Promise.all(queries);
        const patientMap = new Map<number, Patient>();
        for (const res of results) {
          if (!res.error && res.data) {
            for (const p of res.data) {
              patientMap.set(p.id, p as Patient);
            }
          } else if (res.error) {
            console.warn('Nurse finished fetch subquery error:', res.error.message);
          }
        }

        rawFinished = Array.from(patientMap.values()).sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0).getTime() -
            new Date(a.updated_at || a.created_at || 0).getTime()
        );
      }
    }

    if (requestId !== finishedSeqRef.current) {
      return;
    }

    setFinishedPatients(rawFinished);
  }, [getMyCubicleNums]);

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
    const myServices = cachedAssignedServicesRef.current;
    const isSupervisor = userRoleRef.current === 'superadmin' || userRoleRef.current === 'admin';

    const matchesCubicle =
      patient.cubicleNum &&
      (myCubicles.length === 0 ||
        myCubicles.some((c) => String(c).trim().toLowerCase() === String(patient.cubicleNum).trim().toLowerCase()));

    const matchesPreferred =
      Array.isArray(patient.preferredCubicleNums) &&
      patient.preferredCubicleNums.some((pref) =>
        myCubicles.some((c) => String(c).trim().toLowerCase() === String(pref).trim().toLowerCase())
      );

    const matchesService =
      patient.service &&
      myServices.some(
        (s) => String(s).trim().toLowerCase() === String(patient.service).trim().toLowerCase()
      );

    const matchesCubicleCategory =
      patient.service &&
      cachedCubiclesRef.current.some(
        (c) => c.category && String(c.category).trim().toLowerCase() === String(patient.service).trim().toLowerCase()
      );

    const belongsToMe =
      isSupervisor ||
      (myCubicles.length === 0 && myServices.length === 0) ||
      Boolean(matchesCubicle || matchesPreferred || matchesService || matchesCubicleCategory);

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