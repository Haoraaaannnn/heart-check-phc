'use client';
import { supabase } from '@/lib/supabase';
import { Patient } from '../types';

export function useNurseActions(
  setAssignedPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setWithDoctorPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  fetchFinished: () => Promise<void>
) {
  const handleMoveToWithDoctor = async (patient: Patient) => {
    const now = new Date().toISOString();
    
    await supabase.from('patients').update({ 
      status: 'With Doctor',
      consult_start: now
    }).eq('id', patient.id);
    
    setAssignedPatients(prev => prev.filter(p => p.id !== patient.id));
    setWithDoctorPatients(prev => [...prev, { 
      ...patient, 
      status: 'With Doctor',
      consult_start: now
    }]);
  };

  const handleMoveBackFromDoctor = async (patient: Patient) => {
    await supabase.from('patients').update({ 
      status: 'Assigned',
      consult_start: null
    }).eq('id', patient.id);
    
    setWithDoctorPatients(prev => prev.filter(p => p.id !== patient.id));
    setAssignedPatients(prev => [...prev, { ...patient, status: 'Assigned', consult_start: undefined }]);
  };

  const handleFinish = async (patient: Patient) => {
    const now = new Date().toISOString();
    
    await supabase.from('patients').update({ 
      status: 'Done',
      consult_end: now
    }).eq('id', patient.id);
    
    setAssignedPatients(prev => prev.filter(p => p.id !== patient.id));
    setWithDoctorPatients(prev => prev.filter(p => p.id !== patient.id));
    await fetchFinished();
  };

  return { handleMoveToWithDoctor, handleMoveBackFromDoctor, handleFinish };
}