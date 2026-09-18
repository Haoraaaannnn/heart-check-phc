'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

type AssignmentStatus = 'loading' | 'assigned' | 'unassigned' | 'error';

type AssignedCubicle = {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string | null;
};

export function useNurseData() {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [withDoctorPatients, setWithDoctorPatients] = useState<Patient[]>([]);
  const [carryoutPatients, setCarryoutPatients] = useState<Patient[]>([]);
  const [finishedPatients, setFinishedPatients] = useState<Patient[]>([]);
  const [assignmentStatus, setAssignmentStatus] =
    useState<AssignmentStatus>('loading');
  const [assignedCubicleNums, setAssignedCubicleNums] = useState<string[]>([]);
  const [assignedCubicles, setAssignedCubicles] = useState<AssignedCubicle[]>([]);

  const getMyCubicleNums = async () => {
    setAssignmentStatus('loading');

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setAssignmentStatus('error');
      return [];
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !user) {
      setAssignmentStatus('error');
      return [];
    }

    const { data: links, error: linkError } = await supabase
      .from('user_cubicles')
      .select('cubicle_id')
      .eq('user_id', user.id);

    if (linkError) {
      setAssignmentStatus('error');
      return [];
    }

    const cubicleIds = (links ?? []).map((link) => link.cubicle_id);

    if (cubicleIds.length === 0) {
      setAssignedCubicleNums([]);
      setAssignmentStatus('unassigned');
      return [];
    }

    const { data: cubicles, error: cubicleError } = await supabase
      .from('cubicle')
      .select('id, cubicleNum, category, room, subcategory')
      .in('id', cubicleIds);

    if (cubicleError) {
      setAssignmentStatus('error');
      return [];
    }

    const assignedRows = (cubicles ?? []) as AssignedCubicle[];

    const cubicleNums = assignedRows.map(
      (cubicle) => cubicle.cubicleNum
    );

    setAssignedCubicles(assignedRows);
    setAssignedCubicleNums(cubicleNums);

    setAssignmentStatus(
      cubicleNums.length > 0 ? 'assigned' : 'unassigned'
    );

    return cubicleNums;
  };

  const fetchData = async () => {
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
        data.filter(
          (patient: Patient) =>
            patient.status === 'Assigned' && patient.cubicleNum
        )
      );
      setWithDoctorPatients(
        data.filter((patient: Patient) => patient.status === 'With Doctor')
      );
      setCarryoutPatients(
        data.filter((patient: Patient) => patient.status === 'Carryout')
      );
    }
  };

  const fetchFinished = async () => {
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
    }
  };

  return {
    assignedPatients,
    withDoctorPatients,
    carryoutPatients,
    finishedPatients,
    assignmentStatus,
    assignedCubicleNums,
    setAssignedPatients,
    setWithDoctorPatients,
    setCarryoutPatients,
    fetchData,
    fetchFinished,
    assignedCubicles,
  };
}