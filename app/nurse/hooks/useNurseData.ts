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
import { AssignedNurseCubicle, ClinicalStage } from '../types/nurse';

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

  // Cached cubicle discovery to avoid 4 redundant SQL queries on every poll tick
  const cachedCubicleNumsRef = useRef<string[]>([]);
  const cachedCubiclesRef = useRef<AssignedNurseCubicle[]>([]);

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
   * Discovers and retrieves cubicles assigned to the active user,
   * granting full visibility if user has superadmin or admin privileges.
   *
   * @param forceRefresh - If true, bypasses the local cache and queries the database.
   */
  const getMyCubicleNums = useCallback(async (forceRefresh = false): Promise<string[]> => {
    if (!forceRefresh && cachedCubicleNumsRef.current.length > 0) {
      return cachedCubicleNumsRef.current;
    }

    if (cachedCubicleNumsRef.current.length === 0) {
      setAssignmentStatus('loading');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      if (cachedCubicleNumsRef.current.length === 0) {
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
      if (cachedCubicleNumsRef.current.length === 0) {
        setAssignmentStatus('error');
      }
      return cachedCubicleNumsRef.current;
    }

    let cubiclesToFetch: AssignedNurseCubicle[] = [];

    // Superadmin and Admin bypass: full visibility to all hospital cubicles
    if (user.role === 'superadmin' || user.role === 'admin') {
      const { data: allCubicles, error: cubicleError } = await supabase
        .from('cubicle')
        .select('id, cubicleNum, category, room, subcategory, doctorId')
        .order('room', { ascending: true })
        .order('cubicleNum', { ascending: true });

      if (cubicleError) {
        console.error('Failed to load cubicles for admin:', cubicleError);
        if (cachedCubicleNumsRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      cubiclesToFetch = (allCubicles || []) as AssignedNurseCubicle[];
    } else {
      // Standard clinical nurse: query assigned user_cubicles
      const { data: links, error: linkError } = await supabase
        .from('user_cubicles')
        .select('cubicle_id')
        .eq('user_id', user.id);

      if (linkError) {
        console.error('Failed to load user cubicle links:', linkError);
        if (cachedCubicleNumsRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      const cubicleIds = (links ?? []).map((link) => link.cubicle_id);

      if (cubicleIds.length === 0) {
        setAssignedCubicles([]);
        setAssignedCubicleNums([]);
        cachedCubicleNumsRef.current = [];
        cachedCubiclesRef.current = [];
        setAssignmentStatus('unassigned');
        return [];
      }

      const { data: cubicles, error: cubicleError } = await supabase
        .from('cubicle')
        .select('id, cubicleNum, category, room, subcategory, doctorId')
        .in('id', cubicleIds)
        .order('room', { ascending: true })
        .order('cubicleNum', { ascending: true });

      if (cubicleError) {
        console.error('Failed to load assigned cubicle records:', cubicleError);
        if (cachedCubicleNumsRef.current.length === 0) {
          setAssignmentStatus('error');
        }
        return cachedCubicleNumsRef.current;
      }

      cubiclesToFetch = (cubicles || []) as AssignedNurseCubicle[];
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
    setAssignedCubicles(cubiclesToFetch);
    setAssignedCubicleNums(cubicleNums);
    setAssignmentStatus(cubicleNums.length > 0 ? 'assigned' : 'unassigned');

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

    if (cubicleNums.length === 0) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .neq('status', 'Done')
      .in('cubicleNum', cubicleNums)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: true });

    // Discard response if a newer fetch was initiated in the meantime
    if (requestId !== fetchSeqRef.current) {
      return;
    }

    if (!error && data) {
      // Clean up expired in-flight mutation pins
      const now = Date.now();
      for (const [id, pin] of inFlightMutationsRef.current.entries()) {
        if (now > pin.expiresAt) {
          inFlightMutationsRef.current.delete(id);
        }
      }

      // Overlay active pins onto server data so slow writes never revert local state
      const processedData = (data as Patient[]).map((patient) => {
        const pin = inFlightMutationsRef.current.get(patient.id);
        if (pin) {
          if (patient.status === pin.stage) {
            inFlightMutationsRef.current.delete(patient.id);
          } else {
            return { ...patient, status: pin.stage };
          }
        }
        return patient;
      });

      setAssignedPatients(
        processedData.filter((p) => p.status === 'Assigned' && p.cubicleNum)
      );
      setWithDoctorPatients(
        processedData.filter((p) => p.status === 'With Doctor')
      );
      setCarryoutPatients(
        processedData.filter((p) => p.status === 'Carryout')
      );
    } else if (error) {
      console.warn('Nurse background fetch dropped:', error.message);
    }
  }, [getMyCubicleNums]);

  /**
   * Fetches completed patients archived in the daily ledger today.
   */
  const fetchFinished = useCallback(async () => {
    const requestId = ++finishedSeqRef.current;
    const cubicleNums = await getMyCubicleNums(false);

    if (cubicleNums.length === 0) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('status', 'Done')
      .in('cubicleNum', cubicleNums)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('updated_at', { ascending: false });

    if (requestId !== finishedSeqRef.current) {
      return;
    }

    if (!error && data) {
      setFinishedPatients(data as Patient[]);
    } else if (error) {
      console.warn('Nurse finished fetch dropped:', error.message);
    }
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
    const belongsToMe = Boolean(
      patient.cubicleNum &&
      (myCubicles.length === 0 || myCubicles.some((c) => String(c).trim() === String(patient.cubicleNum).trim()))
    );

    // If active pin exists and server status caught up, unpin
    const pin = inFlightMutationsRef.current.get(patient.id);
    if (pin && patient.status === pin.stage) {
      inFlightMutationsRef.current.delete(patient.id);
    }
    const effectiveStatus = pin ? pin.stage : patient.status;

    if (!belongsToMe || effectiveStatus === 'Done') {
      setAssignedPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== patient.id));
      return;
    }

    const updatedPatient: Patient = { ...patient, status: effectiveStatus };

    if (effectiveStatus === 'Assigned') {
      setAssignedPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === updatedPatient.id);
        return idx >= 0 ? prev.map((p, i) => (i === idx ? updatedPatient : p)) : [...prev, updatedPatient];
      });
      setWithDoctorPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
    } else if (effectiveStatus === 'With Doctor') {
      setWithDoctorPatients((prev) => {
        const idx = prev.findIndex((p) => p.id === updatedPatient.id);
        return idx >= 0 ? prev.map((p, i) => (i === idx ? updatedPatient : p)) : [...prev, updatedPatient];
      });
      setAssignedPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
      setCarryoutPatients((prev) => prev.filter((p) => p.id !== updatedPatient.id));
    } else if (effectiveStatus === 'Carryout') {
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