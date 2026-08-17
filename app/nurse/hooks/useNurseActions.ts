'use client';

import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

export function useNurseActions(
  setAssignedPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setWithDoctorPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setCarryoutPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  fetchFinished: () => Promise<void>
) {
  const handleMoveToWithDoctor = async (patient: Patient) => {
    const now = new Date().toISOString();

    await supabase
      .from('patients')
      .update({
        status: 'With Doctor',
        consult_start: now,
      })
      .eq('id', patient.id);

    setAssignedPatients((previous) =>
      previous.filter((item) => item.id !== patient.id)
    );

    setWithDoctorPatients((previous) => [
      ...previous,
      { ...patient, status: 'With Doctor', consult_start: now },
    ]);
  };

  const handleMoveBackFromDoctor = async (patient: Patient) => {
    await supabase
      .from('patients')
      .update({
        status: 'Assigned',
        consult_start: null,
      })
      .eq('id', patient.id);

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

    const { data, error } = await supabase
      .from('patients')
      .update({
        status: 'Carryout',
        consult_end: now,
        carryout_start: now,
        carryout_end: null,
      })
      .eq('id', patient.id)
      .select()
      .single();

  if (error) {
    console.error('MOVE TO CARRYOUT ERROR MESSAGE:', error.message);
    console.error('MOVE TO CARRYOUT ERROR DETAILS:', error.details);
    console.error('MOVE TO CARRYOUT ERROR HINT:', error.hint);
    console.error('MOVE TO CARRYOUT ERROR CODE:', error.code);
    console.error('FULL ERROR:', JSON.stringify(error, null, 2));
    return;
  }

    console.log('MOVE TO CARRYOUT SUCCESS:', data);

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
    await supabase
      .from('patients')
      .update({
        status: 'With Doctor',
        consult_end: null,
        carryout_start: null,
        carryout_end: null,
      })
      .eq('id', patient.id);

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

    await supabase
      .from('patients')
      .update({
        status: 'Done',
        carryout_end: now,
      })
      .eq('id', patient.id);

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