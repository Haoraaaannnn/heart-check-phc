'use client';

import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

export function useNurseActions(
  setAssignedPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setWithDoctorPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setCarryoutPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  fetchFinished: () => Promise<void>
) {
  const savePatient = async (
    patientId: number,
    updates: Record<string, string | null>
  ) => {
    const { error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId);

    if (error) {
      console.error('NURSE UPDATE ERROR:', error.message);
      alert('Unable to update this patient. You may not be assigned to this cubicle.');
      return false;
    }

    return true;
  };

  const handleMoveToWithDoctor = async (patient: Patient) => {
    const now = new Date().toISOString();

    if (
      !(await savePatient(patient.id, {
        status: 'With Doctor',
        consult_start: now,
      }))
    ) {
      return;
    }

    setAssignedPatients((previous) =>
      previous.filter((item) => item.id !== patient.id)
    );

    setWithDoctorPatients((previous) => [
      ...previous,
      { ...patient, status: 'With Doctor', consult_start: now },
    ]);
  };

  const handleMoveBackFromDoctor = async (patient: Patient) => {
    if (
      !(await savePatient(patient.id, {
        status: 'Assigned',
        consult_start: null,
      }))
    ) {
      return;
    }

    setWithDoctorPatients((previous) =>
      previous.filter((item) => item.id !== patient.id)
    );

    setAssignedPatients((previous) => [
      ...previous,
      { ...patient, status: 'Assigned', consult_start: undefined },
    ]);
  };

  const handleMoveToCarryout = async (patient: Patient) => {
    const now = new Date().toISOString();

    if (
      !(await savePatient(patient.id, {
        status: 'Carryout',
        consult_end: now,
        carryout_start: now,
        carryout_end: null,
      }))
    ) {
      return;
    }

    setWithDoctorPatients((previous) =>
      previous.filter((item) => item.id !== patient.id)
    );

    setCarryoutPatients((previous) => [
      ...previous,
      {
        ...patient,
        status: 'Carryout',
        consult_end: now,
        carryout_start: now,
        carryout_end: undefined,
      },
    ]);
  };

  const handleMoveBackFromCarryout = async (patient: Patient) => {
    if (
      !(await savePatient(patient.id, {
        status: 'With Doctor',
        consult_end: null,
        carryout_start: null,
        carryout_end: null,
      }))
    ) {
      return;
    }

    setCarryoutPatients((previous) =>
      previous.filter((item) => item.id !== patient.id)
    );

    setWithDoctorPatients((previous) => [
      ...previous,
      {
        ...patient,
        status: 'With Doctor',
        consult_end: undefined,
        carryout_start: undefined,
        carryout_end: undefined,
      },
    ]);
  };

  const handleFinish = async (patient: Patient) => {
    const now = new Date().toISOString();

    if (
      !(await savePatient(patient.id, {
        status: 'Done',
        carryout_end: now,
      }))
    ) {
      return;
    }

    setCarryoutPatients((previous) =>
      previous.filter((item) => item.id !== patient.id)
    );

    await fetchFinished();
  };

  return {
    handleMoveToWithDoctor,
    handleMoveBackFromDoctor,
    handleMoveToCarryout,
    handleMoveBackFromCarryout,
    handleFinish,
  };
}