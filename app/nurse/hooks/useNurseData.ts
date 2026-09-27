/**
 * @fileoverview Hook managing real-time data fetching, cubicle scoping, and access control
 * for the Nurse Dashboard.
 *
 * Implements Superadmin and Admin bypass parity with the Transfer Dashboard
 * so supervisors can view and coordinate any nurse station without manual assignment links.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';
import { AssignedNurseCubicle } from '../types/nurse';

/**
 * Cubicle assignment status descriptor.
 */
export type AssignmentStatus = 'loading' | 'assigned' | 'unassigned' | 'error';

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

  /**
   * Discovers and retrieves cubicles assigned to the active user,
   * granting full visibility if user has superadmin or admin privileges.
   */
  const getMyCubicleNums = useCallback(async (): Promise<string[]> => {
    setAssignmentStatus('loading');

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setAssignmentStatus('error');
      return [];
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
      setAssignmentStatus('error');
      return [];
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
        setAssignmentStatus('error');
        return [];
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
        setAssignmentStatus('error');
        return [];
      }

      const cubicleIds = (links ?? []).map((link) => link.cubicle_id);

      if (cubicleIds.length === 0) {
        setAssignedCubicles([]);
        setAssignedCubicleNums([]);
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
        setAssignmentStatus('error');
        return [];
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

    setAssignedCubicles(cubiclesToFetch);
    setAssignedCubicleNums(cubicleNums);
    setAssignmentStatus(cubicleNums.length > 0 ? 'assigned' : 'unassigned');

    return cubicleNums;
  }, []);

  /**
   * Fetches active patients currently progressing through cubicle stages today.
   */
  const fetchData = useCallback(async () => {
    const cubicleNums = await getMyCubicleNums();

    if (cubicleNums.length === 0) {
      setAssignedPatients([]);
      setWithDoctorPatients([]);
      setCarryoutPatients([]);
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

    if (!error && data) {
      setAssignedPatients(
        data.filter((patient: Patient) => patient.status === 'Assigned' && patient.cubicleNum)
      );
      setWithDoctorPatients(
        data.filter((patient: Patient) => patient.status === 'With Doctor')
      );
      setCarryoutPatients(
        data.filter((patient: Patient) => patient.status === 'Carryout')
      );
    } else if (error) {
      console.error('Error fetching active nurse patients:', error);
    }
  }, [getMyCubicleNums]);

  /**
   * Fetches completed patients archived in the daily ledger today.
   */
  const fetchFinished = useCallback(async () => {
    const cubicleNums = await getMyCubicleNums();

    if (cubicleNums.length === 0) {
      setFinishedPatients([]);
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

    if (!error && data) {
      setFinishedPatients(data);
    } else if (error) {
      console.error('Error fetching finished nurse patients:', error);
    }
  }, [getMyCubicleNums]);

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
  };
}

export default useNurseData;