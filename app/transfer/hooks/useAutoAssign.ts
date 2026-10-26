/**
 * @fileoverview Automatically assigns eligible transfer patients to cubicles with capacity.
 * @module app/transfer/hooks/useAutoAssign
 */
'use client';
import { useCallback, useEffect, useRef } from 'react';
import { Patient, Cubicle } from '@/types/Types';
import { Service } from '@/types/Services';
import { AUTO_ASSIGN_SERVICES, MAX_PATIENTS_PER_CUBICLE } from '@/app/transfer/lib/constants';
import { assignmentCandidates, updateLiveTransferPatient } from '@/app/transfer/lib/transferMutations';

/**
 * Watches queue and cubicle occupancy changes and fills every available auto-assign slot.
 * @param selectedCategory - Currently selected service category.
 * @param onProgressPatients - Patients awaiting cubicle assignment.
 * @param assignedPatients - Current patients grouped by cubicle number.
 * @param cubicles - Configured cubicles and their service categories.
 * @param setPendingUpdates - Queues assignment changes requiring subcategory confirmation.
 * @param setOnProgressPatients - Removes assigned patients from the waiting list.
 * @param setAssignedPatients - Updates the visible cubicle occupancy.
 * @param busyRef - Prevents concurrent assignment passes.
 * @param allServices - Live service rules, when available.
 * @returns Nothing; assignment runs as a side effect of queue or capacity changes.
 */
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
  const rerunRequested = useRef(false);
  const latestAutoAssign = useRef<() => Promise<void>>(async () => {});
  const retryAfterMs = useRef<Map<number, number>>(new Map());

  const autoAssignPatients = useCallback(async () => {
    if (busyRef.current) {
      rerunRequested.current = true;
      return;
    }
    busyRef.current = true;

    const isOnCooldown = (p: Patient) =>
      !!p.cooldown_until && new Date(p.cooldown_until).getTime() > Date.now();

    const dbUpdates: { id: number; cubicleNum: string; status: string; reg_end: string; called_at: string; queue_position: number }[] = [];
    try {
      const allAssignedIds: number[] = [];
      const scheduledCounts: Record<string, number> = {};

      // Resolve eligible auto-assign services from live database catalog or fallback
      const targetServices = allServices && allServices.length > 0
        ? allServices.filter(s => s.auto_assign).map(s => s.label_en)
        : AUTO_ASSIGN_SERVICES;

      for (const service of targetServices) {
        const serviceObj = allServices?.find(s => s.label_en === service);
        const availableCubicles = cubicles.filter(c => c.category === service);
        const waitingPatients = onProgressPatients.filter(p => {
          if (p.service !== service) return false;
          if ((retryAfterMs.current.get(p.id) ?? 0) > Date.now()) return false;
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
          const assignedCount = (assignedPatients[cubicle.cubicleNum]?.length || 0)
            + (scheduledCounts[cubicle.cubicleNum] || 0);
          if (assignedCount < MAX_PATIENTS_PER_CUBICLE) {
            availableSpots.push({ cubicle, currentCount: assignedCount });
          }
        }

        if (availableSpots.length === 0 || waitingPatients.length === 0) continue;

        availableSpots.sort((a, b) => a.currentCount - b.currentCount);
        const now = new Date().toISOString();

        for (const spot of availableSpots) {
          const remainingCapacity = MAX_PATIENTS_PER_CUBICLE - spot.currentCount;
          for (let slot = 0; slot < remainingCapacity; slot += 1) {
            const patient = waitingPatients.find(candidate => !allAssignedIds.includes(candidate.id)
              && assignmentCandidates({ patient: candidate, cubicles: [spot.cubicle], assigned: assignedPatients }).length > 0);
            if (!patient) break;
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
            }

            setAssignedPatients(prev => ({
              ...prev,
              [updatedPatient.cubicleNum!]: [
                ...(prev[updatedPatient.cubicleNum!] || []),
                updatedPatient,
              ],
            }));
            scheduledCounts[updatedPatient.cubicleNum!] = (scheduledCounts[updatedPatient.cubicleNum!] || 0) + 1;
          }
        }
      }

      const cubicleCounts: Record<string, number> = {};
      for (const [cubicleNum, patients] of Object.entries(assignedPatients)) {
        cubicleCounts[cubicleNum] = patients.length;
      }
      for (const [cubicleNum, count] of Object.entries(scheduledCounts)) {
        cubicleCounts[cubicleNum] = (cubicleCounts[cubicleNum] || 0) + count;
      }

      // Auto-assign patients with preferred cubicles (matching any service with preferred stations)
      const preferredPatients = onProgressPatients.filter(
        (patient) => {
          const sObj = allServices?.find(s => s.label_en === patient.service);
          const requiresReg = sObj ? sObj.requires_registration : true;
          if (requiresReg && !patient.reg_end) return false;
          if (isOnCooldown(patient)) return false;
          if (allAssignedIds.includes(patient.id)) return false;
          if ((retryAfterMs.current.get(patient.id) ?? 0) > Date.now()) return false;
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
        for (const { id, ...fields } of dbUpdates) {
          await updateLiveTransferPatient({ id, fields });
        }
      }

      if (allAssignedIds.length > 0) {
        setOnProgressPatients(prev =>
          prev.filter(p => !allAssignedIds.includes(p.id))
        );
      }

       } catch {
      const failedIds = new Set(dbUpdates.map(update => update.id));
      for (const id of failedIds) retryAfterMs.current.set(id, Date.now() + 60_000);
      setAssignedPatients(previous => Object.fromEntries(Object.entries(previous)
        .map(([cubicleNum, patients]) => [cubicleNum, patients.filter(patient => !failedIds.has(patient.id))])));
      console.warn('Automatic assignment was not acknowledged; patients remain in the queue.');
    } finally {
      busyRef.current = false;
      if (rerunRequested.current) {
        rerunRequested.current = false;
        latestAutoAssign.current();
      }
    }
  }, [allServices, assignedPatients, busyRef, cubicles, onProgressPatients, setAssignedPatients, setOnProgressPatients, setPendingUpdates]);

  useEffect(() => {
    latestAutoAssign.current = autoAssignPatients;
    void autoAssignPatients();
  }, [autoAssignPatients]);

  useEffect(() => {
    const nextCooldownExpiry = onProgressPatients
      .map((patient) => patient.cooldown_until ? new Date(patient.cooldown_until).getTime() : 0)
      .filter((expiry) => expiry > Date.now())
      .sort((a, b) => a - b)[0];

    if (!nextCooldownExpiry) return;

    const timeout = window.setTimeout(() => {
      latestAutoAssign.current();
    }, Math.max(0, nextCooldownExpiry - Date.now()) + 10);

    return () => window.clearTimeout(timeout);
  }, [onProgressPatients]);
}
