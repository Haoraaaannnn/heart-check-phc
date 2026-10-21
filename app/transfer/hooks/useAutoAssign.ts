'use client';
import { useEffect, useRef } from 'react';
import { Patient, Cubicle } from '@/types/Types';
import { Service } from '@/types/Services';
import { AUTO_ASSIGN_SERVICES, MAX_PATIENTS_PER_CUBICLE } from '@/app/transfer/lib/constants';
import { supabase } from "@/lib/supabase";

export function useAutoAssign(
  selectedCategory: string | null,
  onProgressPatients: Patient[],
  assignedPatients: Record<string, Patient[]>,
  cubicles: Cubicle[],
  setPendingUpdates: React.Dispatch<React.SetStateAction<Patient[]>>,
  setOnProgressPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setAssignedPatients: React.Dispatch<React.SetStateAction<Record<string, Patient[]>>>,
  busyRef: React.MutableRefObject<boolean>,
  allServices?: Service[]
) {
  const autoAssignPatients = async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    const isOnCooldown = (p: Patient) =>
      !!p.cooldown_until && new Date(p.cooldown_until).getTime() > Date.now();

    try {
      const dbUpdates: { id: number; cubicleNum: string; status: string; reg_end: string; called_at: string; queue_position: number }[] = [];
      const allAssignedIds: number[] = [];
      let anyAutoAssigned = false;

      // Resolve eligible auto-assign services from live database catalog or fallback
      const targetServices = allServices && allServices.length > 0
        ? allServices.filter(s => s.auto_assign).map(s => s.label_en)
        : AUTO_ASSIGN_SERVICES;

      for (const service of targetServices) {
        const serviceObj = allServices?.find(s => s.label_en === service);
        const availableCubicles = cubicles.filter(c => c.category === service);
        const waitingPatients = onProgressPatients.filter(p => {
          if (p.service !== service) return false;
          // If this service requires registration desk intake, do not assign until registration is finished
          const requiresReg = serviceObj ? (serviceObj.requires_registration ?? false) : (service === 'Consultation' || service === 'OPD Screening');
          if (requiresReg && !p.reg_end) {
            return false;
          }
          if (isOnCooldown(p)) return false;
          return true;
        });

        const availableSpots: { cubicle: Cubicle; currentCount: number }[] = [];
        for (const cubicle of availableCubicles) {
          const assignedCount = assignedPatients[cubicle.cubicleNum]?.length || 0;
          if (assignedCount < MAX_PATIENTS_PER_CUBICLE) {
            availableSpots.push({ cubicle, currentCount: assignedCount });
          }
        }

        if (availableSpots.length === 0 || waitingPatients.length === 0) continue;

        availableSpots.sort((a, b) => a.currentCount - b.currentCount);
        const now = new Date().toISOString();
        let patientIndex = 0;

        for (const spot of availableSpots) {
          if (patientIndex >= waitingPatients.length) break;

          const patient = waitingPatients[patientIndex++];
          allAssignedIds.push(patient.id);

          const updatedPatient = {
            ...patient,
            cubicleNum: spot.cubicle.cubicleNum,
            status: "Assigned",
            reg_end: now,
            called_at: now,
          };

          const hasSubcats = serviceObj ? serviceObj.has_subcategories : (patient.service === "Consultation" || patient.service === "OPD Screening");
          if (hasSubcats) {
            setPendingUpdates(prev => [
              ...prev.filter(p => p.id !== patient.id),
              updatedPatient,
            ]);
          } else {
            dbUpdates.push({
              id: patient.id,
              cubicleNum: updatedPatient.cubicleNum!,
              status: "Assigned",
              reg_end: now,
              called_at: now,
              queue_position: 9999,
            });
            anyAutoAssigned = true;
          }

          setAssignedPatients(prev => ({
            ...prev,
            [updatedPatient.cubicleNum!]: [
              ...(prev[updatedPatient.cubicleNum!] || []),
              updatedPatient,
            ],
          }));
        }
      }

      const cubicleCounts: Record<string, number> = {};
      for (const [cubicleNum, patients] of Object.entries(assignedPatients)) {
        cubicleCounts[cubicleNum] = patients.length;
      }

      // Auto-assign patients with preferred cubicles (matching any service with preferred stations)
      const preferredPatients = onProgressPatients.filter(
        (patient) => {
          const sObj = allServices?.find(s => s.label_en === patient.service);
          const requiresReg = sObj ? sObj.requires_registration : true;
          if (requiresReg && !patient.reg_end) return false;
          if (isOnCooldown(patient)) return false;
          return Boolean(patient.preferredCubicleNums && patient.preferredCubicleNums.length > 0);
        }
      );

      const now2 = new Date().toISOString();

      for (const patient of preferredPatients) {
        const freeCubicle = patient.preferredCubicleNums!
          .map((cubicleNum) =>
            cubicles.find(
              (cubicle) =>
                cubicle.cubicleNum === cubicleNum &&
                cubicle.category === patient.service &&
                (!patient.subcategory || cubicle.subcategory === patient.subcategory)
            )
          )
          .find(
            (cubicle) =>
              cubicle && (cubicleCounts[cubicle.cubicleNum] || 0) < MAX_PATIENTS_PER_CUBICLE
          );

        if (!freeCubicle) continue;

        const updatedPatient = {
          ...patient,
          cubicleNum: freeCubicle.cubicleNum,
          status: "Assigned",
          reg_end: now2,
          called_at: now2,
        };

        dbUpdates.push({
          id: patient.id,
          cubicleNum: freeCubicle.cubicleNum,
          status: "Assigned",
          reg_end: now2,
          called_at: now2,
          queue_position: 9999,
        });
        anyAutoAssigned = true;

        allAssignedIds.push(patient.id);
        cubicleCounts[freeCubicle.cubicleNum] = (cubicleCounts[freeCubicle.cubicleNum] || 0) + 1;

        setAssignedPatients((previous) => ({
          ...previous,
          [freeCubicle.cubicleNum]: [
            ...(previous[freeCubicle.cubicleNum] || []).filter(p => p.id !== updatedPatient.id),
            updatedPatient,
          ],
        }));
      }

      if (dbUpdates.length > 0) {
        await supabase.from("patients").upsert(dbUpdates, { onConflict: "id" });
      }

      if (allAssignedIds.length > 0) {
        setOnProgressPatients(prev =>
          prev.filter(p => !allAssignedIds.includes(p.id))
        );
      }

      if (anyAutoAssigned) {
        const { data: queue } = await supabase
          .from("patients")
          .select("id")
          .neq("status", "Assigned")
          .order("queue_position");

        if (queue && queue.length > 0) {
          const reorder = queue.map((row, i) => ({ id: row.id, queue_position: i + 1 }));
          await supabase.from("patients").upsert(reorder, { onConflict: "id" });
        }
      }
       } catch (error) {
      console.error('Auto-assign error:', error);
    } finally {
      busyRef.current = false;
    }
  };

  useEffect(() => {
    autoAssignPatients();
  }, [onProgressPatients, cubicles]);
}
