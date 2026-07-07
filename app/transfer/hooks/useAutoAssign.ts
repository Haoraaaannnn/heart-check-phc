'use client';
import { useEffect, useRef } from 'react';
import { Patient, Cubicle } from '@/types/Types';
import { AUTO_ASSIGN_SERVICES, MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';

export function useAutoAssign(
  selectedCategory: string | null,
  onProgressPatients: Patient[],
  assignedPatients: Record<string, Patient[]>,
  cubicles: Cubicle[],
  setPendingUpdates: React.Dispatch<React.SetStateAction<Patient[]>>,
  setOnProgressPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setAssignedPatients: React.Dispatch<React.SetStateAction<Record<string, Patient[]>>>
) {
  const autoAssigning = useRef(false);

  const autoAssignPatients = async () => {
    if (!selectedCategory) return;
    if (!AUTO_ASSIGN_SERVICES.includes(selectedCategory)) return;
    if (autoAssigning.current) return;

    autoAssigning.current = true;

    try {
      const availableCubicles = cubicles.filter(c => c.category === selectedCategory);
      if (availableCubicles.length === 0) return;

      const waitingPatients = onProgressPatients.filter(p => p.service === selectedCategory);
      if (waitingPatients.length === 0) return;

      const availableSpots: { cubicle: Cubicle; currentCount: number }[] = [];
      
      for (const cubicle of availableCubicles) {
        const assignedCount = assignedPatients[cubicle.cubicleNum]?.length || 0;
        if (assignedCount < MAX_PATIENTS_PER_CUBICLE) {
          availableSpots.push({ cubicle, currentCount: assignedCount });
        }
      }

      if (availableSpots.length === 0) return;

      availableSpots.sort((a, b) => a.currentCount - b.currentCount);
      const targetCubicle = availableSpots[0].cubicle;
      const patientToAssign = waitingPatients[0];
      const now = new Date().toISOString();
      
      setPendingUpdates(prev => [
          ...prev.filter(p => p.id !== patientToAssign.id),
          {
              ...patientToAssign,
              cubicleNum: targetCubicle.cubicleNum,
              status: "Assigned",
              reg_end: now
          }
      ]);

    setOnProgressPatients(prev =>
      prev.filter(p => p.id !== patientToAssign.id)
    );

    setAssignedPatients(prev => ({
      ...prev,
      [targetCubicle.cubicleNum]: [
        ...(prev[targetCubicle.cubicleNum] || []),
        {
          ...patientToAssign,
          cubicleNum: targetCubicle.cubicleNum,
          status: "Assigned",
          reg_end: now,
        },
      ],
    }));

    setPendingUpdates(prev => [
      ...prev.filter(p => p.id !== patientToAssign.id),
      {
        ...patientToAssign,
        cubicleNum: targetCubicle.cubicleNum,
        status: "Assigned",
        reg_end: now,
      },
    ]);

    } catch (error) {
      console.error('Auto-assign error:', error);
    } finally {
      autoAssigning.current = false;
    }
  };

  useEffect(() => {
    if (selectedCategory && AUTO_ASSIGN_SERVICES.includes(selectedCategory)) {
      autoAssignPatients();
    }
  }, [onProgressPatients, selectedCategory, cubicles, assignedPatients]);
}
