'use client';
import { useEffect, useRef } from 'react';
import { Patient, Cubicle } from '@/types/Types';
import { AUTO_ASSIGN_SERVICES, MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';
import { supabase } from "@/lib/supabase";

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
    if (autoAssigning.current) return;

    autoAssigning.current = true;

    try {
      
      for (const service of AUTO_ASSIGN_SERVICES) {

          const availableCubicles = cubicles.filter(
              c => c.category === service
          );

          const waitingPatients = onProgressPatients.filter(
              p => p.service === service
          );

      const availableSpots: { cubicle: Cubicle; currentCount: number }[] = [];
      
      for (const cubicle of availableCubicles) {
        const assignedCount = assignedPatients[cubicle.cubicleNum]?.length || 0;
        if (assignedCount < MAX_PATIENTS_PER_CUBICLE) {
          availableSpots.push({ cubicle, currentCount: assignedCount });
        }
      }

      if (availableSpots.length === 0) continue;
      if (waitingPatients.length === 0) continue;

      availableSpots.sort((a, b) => a.currentCount - b.currentCount);
      const now = new Date().toISOString();

      let patientIndex = 0;

      const assignedIds: number[] = [];

      for (const spot of availableSpots) {
          if (patientIndex >= waitingPatients.length) break;

          const patient = waitingPatients[patientIndex++];
          assignedIds.push(patient.id);

          const now = new Date().toISOString();

          const updatedPatient = {
              ...patient,
              cubicleNum: spot.cubicle.cubicleNum,
              status: "Assigned",
              reg_end: now,
              called_at: now,
          };

          if (
              patient.service === "Consultation" ||
              patient.service === "OPD Screening"
          ) {
              setPendingUpdates(prev => [
                  ...prev.filter(p => p.id !== patient.id),
                  updatedPatient,
              ]);
          } else {
              await supabase
                  .from("patients")
                  .update({
                      cubicleNum: updatedPatient.cubicleNum,
                      status: "Assigned",
                      reg_end: now,
                      called_at: now,
                      queue_position: 9999,
                  })
                  .eq("id", patient.id);
          }

          setAssignedPatients(prev => ({
              ...prev,
              [updatedPatient.cubicleNum!]: [
                  ...(prev[updatedPatient.cubicleNum!] || []),
                  updatedPatient,
              ],
          }));
      } // <-- THIS is where the closing brace belongs

      // Remove all assigned patients from On Progress
      setOnProgressPatients(prev =>
          prev.filter(p => !assignedIds.includes(p.id))
      );

      // Reorder the queue ONCE
      const { data: queue } = await supabase
          .from("patients")
          .select("id")
          .neq("status", "Assigned")
          .order("queue_position");

      if (queue) {
          for (let i = 0; i < queue.length; i++) {
              await supabase
                  .from("patients")
                  .update({
                      queue_position: i + 1,
                  })
                  .eq("id", queue[i].id);
          }
      }
    }


    } catch (error) {
      console.error('Auto-assign error:', error);
    } finally {
      autoAssigning.current = false;
    }
  };

  useEffect(() => {
      autoAssignPatients();
  }, [onProgressPatients, cubicles]);
}
