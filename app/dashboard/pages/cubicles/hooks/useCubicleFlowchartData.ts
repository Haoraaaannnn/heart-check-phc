/**
 * @fileoverview Custom React hook for synchronizing and computing outpatient cubicle pipeline
 * flowchart data, stage metrics, cubicle stations telemetry, and idle turnaround intervals.
 *
 * @module app/dashboard/pages/cubicles/hooks/useCubicleFlowchartData
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getStatusGroup } from '@/constants/queueStatus';
import type { Service } from '@/types/Services';
import type {
  PipelineStageKey,
  FlowchartStageData,
  FlowchartCubicleStation,
  FlowchartPatientItem,
  FlowchartPipelineKpis,
  SpeedRating,
  IdleRating,
  CubicleStatus,
} from '@/app/dashboard/pages/cubicles/types/cubicle';
import {
  CUBICLES_REFRESH_INTERVAL_MS,
  CUBICLES_CLOCK_INTERVAL_MS,
  HEATMAP_SPEED_THRESHOLDS,
  HEATMAP_IDLE_THRESHOLDS,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';

/** Default assumed standard consultation duration in minutes. */
const TARGET_CONSULTATION_MINUTES = 20;

/**
 * Safely parses string timestamps into Date instances.
 *
 * @param ts - ISO or SQL formatted timestamp string.
 * @returns Valid Date instance or null.
 */
function parseTimestamp(ts: string | null | undefined): Date | null {
  if (!ts) return null;
  const normalized =
    ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Categorizes consultation processing speed rating.
 *
 * @param elapsedMins - Elapsed duration in minutes.
 * @returns Speed rating.
 */
function getSpeedRating(elapsedMins: number): SpeedRating {
  if (elapsedMins < HEATMAP_SPEED_THRESHOLDS.fastMax) return 'fast';
  if (elapsedMins <= HEATMAP_SPEED_THRESHOLDS.optimalMax) return 'optimal';
  if (elapsedMins <= HEATMAP_SPEED_THRESHOLDS.moderateMax) return 'moderate';
  return 'slow';
}

/**
 * Categorizes idle interval duration.
 *
 * @param idleMins - Unoccupied duration in minutes.
 * @returns Idle rating.
 */
function getIdleRating(idleMins: number): IdleRating {
  if (idleMins < HEATMAP_IDLE_THRESHOLDS.continuousMax) return 'continuous';
  if (idleMins <= HEATMAP_IDLE_THRESHOLDS.lowIdleMax) return 'low-idle';
  if (idleMins <= HEATMAP_IDLE_THRESHOLDS.moderateIdleMax) return 'moderate-idle';
  if (idleMins <= HEATMAP_IDLE_THRESHOLDS.highIdleMax) return 'high-idle';
  return 'dormant';
}

/**
 * Hook providing live pipeline progression data across the 5 outpatient stages.
 *
 * @returns Pipeline stages array, cubicle stations, summary KPIs, loading state, and modal inspection target.
 */
export function useCubicleFlowchartData() {
  const [stages, setStages] = useState<Record<PipelineStageKey, FlowchartStageData>>({
    waiting: {
      key: 'waiting',
      title: '1. Kiosk',
      subtitle: 'Self-service check-in',
      icon: 'bx-devices',
      count: 0,
      metricLabel: 'Mean Wait Time',
      metricValue: '0m',
      patients: [],
    },
    dispatch: {
      key: 'dispatch',
      title: '2. Registration',
      subtitle: 'Verification counters',
      icon: 'bx-user-check',
      count: 0,
      metricLabel: 'Transit Grace',
      metricValue: '<5m',
      patients: [],
    },
    examination: {
      key: 'examination',
      title: '3. Nurse',
      subtitle: 'Clinical service stations',
      icon: 'bx-first-aid',
      count: 0,
      metricLabel: 'Active Rooms',
      metricValue: '0 / 0',
      patients: [],
    },
    carryout: {
      key: 'carryout',
      title: '4. Carryout',
      subtitle: 'Post-consultation instructions',
      icon: 'bx-file-blank',
      count: 0,
      metricLabel: 'Mean Carryout',
      metricValue: '0m',
      patients: [],
    },
    completed: {
      key: 'completed',
      title: '5. Finished',
      subtitle: 'Completed & discharged',
      icon: 'bx-check-double',
      count: 0,
      metricLabel: 'Today Served',
      metricValue: '0 pts',
      patients: [],
    },
  });

  const [cubicleStations, setCubicleStations] = useState<FlowchartCubicleStation[]>([]);
  const [kpis, setKpis] = useState<FlowchartPipelineKpis>({
    totalInPipeline: 0,
    waitingCount: 0,
    dispatchCount: 0,
    activeExamCount: 0,
    carryoutCount: 0,
    completedTodayCount: 0,
    idleCubiclesCount: 0,
    availableCubiclesCount: 0,
    totalCubiclesCount: 0,
    facilityUtilizationPercent: 0,
    facilityAvgSpeedMinutes: 0,
    facilityAvgIdleMinutes: 0,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [todayRawPatients, setTodayRawPatients] = useState<any[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<
    FlowchartPatientItem | FlowchartCubicleStation | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  const fetchFlowchartData = useCallback(async () => {
    try {
      setError(null);
      const now = new Date();

      // 0. Fetch services configured dynamically in Superadmin
      const { data: servicesData, error: servicesErr } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (servicesErr) {
        console.warn('Could not query services table, using fallback:', servicesErr);
      }

      // 1. Fetch configured clinical examination rooms
      const { data: cubicleData, error: cubicleErr } = await supabase
        .from('cubicle')
        .select('*')
        .order('id', { ascending: true });

      if (cubicleErr) throw cubicleErr;
      const rawCubicles = cubicleData || [];

      // 2. Fetch doctors for cubicle mapping
      const doctorIds = Array.from(
        new Set(rawCubicles.map((c: any) => c.doctorId).filter(Boolean))
      ) as string[];

      const doctorNameMap: Record<string, string> = {};
      if (doctorIds.length > 0) {
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('id, full_name')
          .in('id', doctorIds);

        if (doctorsData) {
          doctorsData.forEach((d: any) => {
            doctorNameMap[d.id] = d.full_name;
          });
        }
      }

      // 3. Fetch today's patient records
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      ).toISOString();

      const { data: patientsData, error: patientsErr } = await supabase
        .from('patients')
        .select(
          'id, patientNum, service, cubicleNum, status, created_at, consult_start, consult_end, carryout_start, called_at'
        )
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (patientsErr) {
        console.warn('Error querying patients for flowchart pipeline:', patientsErr);
      }

      const todayPatients = patientsData || [];

      // Partition patients into the 5 stages
      const waitingList: FlowchartPatientItem[] = [];
      const dispatchList: FlowchartPatientItem[] = [];
      const examList: FlowchartPatientItem[] = [];
      const carryoutList: FlowchartPatientItem[] = [];
      const completedList: FlowchartPatientItem[] = [];

      // Map active consultations by cubicle number
      const activeByCubicle: Record<string, FlowchartPatientItem> = {};
      const completedByCubicle: Record<string, any[]> = {};

      todayPatients.forEach((patient: any) => {
        const group = getStatusGroup(patient.status);
        const createdAt = parseTimestamp(patient.created_at) || now;
        const consultStart = parseTimestamp(patient.consult_start);
        const consultEnd = parseTimestamp(patient.consult_end);
        const calledAt = parseTimestamp(patient.called_at);
        const carryoutStart = parseTimestamp(patient.carryout_start);
        const normCubicle = (patient.cubicleNum || '').trim();

        const pItem: FlowchartPatientItem = {
          id: patient.id,
          patientNum: patient.patientNum || `P-${patient.id}`,
          service: patient.service || 'Consultation',
          status: patient.status || 'Active',
          cubicleNum: normCubicle || null,
          consultStart: consultStart || undefined,
          consultEnd: consultEnd || undefined,
        };

        if (group === 'done') {
          pItem.enteredStageAt = consultEnd || createdAt;
          pItem.elapsedMinutes = consultEnd
            ? Math.round((consultEnd.getTime() - createdAt.getTime()) / 60000)
            : 0;
          completedList.push(pItem);

          if (normCubicle) {
            const key = normCubicle.toLowerCase();
            if (!completedByCubicle[key]) completedByCubicle[key] = [];
            completedByCubicle[key].push(patient);
          }
        } else if (carryoutStart || (patient.status || '').toLowerCase().includes('carryout')) {
          pItem.enteredStageAt = carryoutStart || now;
          pItem.elapsedMinutes = Math.round(
            (now.getTime() - (carryoutStart || now).getTime()) / 60000
          );
          carryoutList.push(pItem);
        } else if (
          group === 'serving' ||
          consultStart !== null ||
          ['on progress', 'consulting', 'with doctor'].includes(
            (patient.status || '').toLowerCase()
          )
        ) {
          const startTs = consultStart || createdAt;
          const elapsed = Math.max(0, Math.round((now.getTime() - startTs.getTime()) / 60000));
          pItem.enteredStageAt = startTs;
          pItem.elapsedMinutes = elapsed;
          pItem.isStalled = elapsed > 35;
          examList.push(pItem);

          if (normCubicle) {
            activeByCubicle[normCubicle.toLowerCase()] = pItem;
          }
        } else if (
          patient.counter ||
          patient.reg_start ||
          calledAt !== null ||
          (normCubicle && !consultStart) ||
          (patient.status || '').toLowerCase() === 'called'
        ) {
          const startTransit = parseTimestamp(patient.reg_start) || calledAt || createdAt;
          pItem.enteredStageAt = startTransit;
          pItem.elapsedMinutes = Math.max(
            0,
            Math.round((now.getTime() - startTransit.getTime()) / 60000)
          );
          pItem.isStalled = pItem.elapsedMinutes > 10;
          dispatchList.push(pItem);
        } else {
          // Waiting at Kiosk
          pItem.enteredStageAt = createdAt;
          pItem.elapsedMinutes = Math.max(
            0,
            Math.round((now.getTime() - createdAt.getTime()) / 60000)
          );
          pItem.isStalled = pItem.elapsedMinutes > 30;
          waitingList.push(pItem);
        }
      });

      // Compute average wait time
      const meanWaitMinutes =
        waitingList.length > 0
          ? Math.round(
              waitingList.reduce((acc, p) => acc + (p.elapsedMinutes || 0), 0) /
                waitingList.length
            )
          : 0;

      // Compute average carryout time
      const meanCarryoutMinutes =
        carryoutList.length > 0
          ? Math.round(
              carryoutList.reduce((acc, p) => acc + (p.elapsedMinutes || 0), 0) /
                carryoutList.length
            )
          : 0;

      // Build Cubicle Stations Telemetry
      let occupiedCount = 0;
      let totalConsultDurationsToday = 0;
      let totalConsultCountToday = 0;
      let totalIdleMinutesSum = 0;

      const stations: FlowchartCubicleStation[] = rawCubicles.map((cubicle: any) => {
        const normKey = cubicle.cubicleNum.trim().toLowerCase();
        const activePatient = activeByCubicle[normKey];
        const completedForCubicle = completedByCubicle[normKey] || [];
        const doctorName = cubicle.doctorId ? doctorNameMap[cubicle.doctorId] : undefined;

        let status: CubicleStatus = 'available';
        let elapsedMins: number | undefined;
        let estimatedRemaining: number | undefined;
        let speedRating: SpeedRating | undefined;
        let idleMins: number | undefined;
        let idleRating: IdleRating | undefined;

        // Calculate cubicle historical throughput today
        let cubicleTodaySpeedSum = 0;
        completedForCubicle.forEach((p: any) => {
          const cStart = parseTimestamp(p.consult_start) || parseTimestamp(p.created_at);
          const cEnd = parseTimestamp(p.consult_end);
          if (cStart && cEnd) {
            cubicleTodaySpeedSum += Math.max(1, (cEnd.getTime() - cStart.getTime()) / 60000);
          }
        });

        const cubicleAvgSpeed =
          completedForCubicle.length > 0
            ? parseFloat(
                (cubicleTodaySpeedSum / completedForCubicle.length).toFixed(1)
              )
            : 0;

        totalConsultDurationsToday += cubicleTodaySpeedSum;
        totalConsultCountToday += completedForCubicle.length;

        if (activePatient) {
          status = 'occupied';
          occupiedCount += 1;
          elapsedMins = activePatient.elapsedMinutes || 0;
          estimatedRemaining = Math.max(
            0,
            TARGET_CONSULTATION_MINUTES - elapsedMins
          );
          speedRating = getSpeedRating(elapsedMins);
        } else {
          status = 'available';
          // Estimate idle turnaround gap since last completed consultation
          let lastCompletedTs: Date | null = null;
          if (completedForCubicle.length > 0) {
            const latest = completedForCubicle[0];
            lastCompletedTs =
              parseTimestamp(latest.consult_end) || parseTimestamp(latest.created_at);
          }

          idleMins = lastCompletedTs
            ? Math.max(0, Math.round((now.getTime() - lastCompletedTs.getTime()) / 60000))
            : 15; // default moderate buffer if start of shift

          idleRating = getIdleRating(idleMins);
          totalIdleMinutesSum += idleMins;
        }

        return {
          id: cubicle.id,
          cubicleNum: cubicle.cubicleNum,
          category: cubicle.category || 'Consultation',
          assignedDoctor: doctorName,
          status,
          currentPatient: activePatient,
          elapsedMinutes: elapsedMins,
          estimatedRemainingMinutes: estimatedRemaining,
          speedRating,
          idleMinutes: idleMins,
          idleRating,
          totalConsultationsToday: completedForCubicle.length,
          avgSpeedTodayMinutes: cubicleAvgSpeed,
        };
      });

      // Resolve clinical services dynamically from Superadmin services table
      const rawServices: Service[] = (servicesData as Service[]) || [];
      const knownCategorySet = new Set(
        rawServices.map((s) => s.label_en.trim().toLowerCase())
      );

      // Append any cubicle categories not yet registered in services table
      const extraServices: Service[] = [];
      rawCubicles.forEach((c: any) => {
        const cat = (c.category || '').trim();
        if (cat && !knownCategorySet.has(cat.toLowerCase())) {
          knownCategorySet.add(cat.toLowerCase());
          extraServices.push({
            id: 9000 + extraServices.length,
            label_en: cat,
            label_fil: cat,
            icon_src: 'bx-clinic',
            display_order: 100 + extraServices.length,
            description_en: `${cat} Clinical Services`,
            description_fil: `${cat} Kagawaran`,
            patient_type: 'both',
          });
        }
      });

      let finalServices = [...rawServices, ...extraServices];

      // Fallback only if database services and cubicles are completely unseeded (fresh DB)
      if (finalServices.length === 0) {
        finalServices = [
          { id: 1, label_en: 'Consultation', label_fil: 'Konsultasyon', icon_src: 'bx-chat', display_order: 1, description_en: 'Cardiology Physician Rooms', description_fil: 'Doktor ng Puso', patient_type: 'both' },
          { id: 2, label_en: 'OPD Screening', label_fil: 'Screening', icon_src: 'bx-search-alt-2', display_order: 2, description_en: 'Triage & Vital Signs', description_fil: 'Pagsusuri ng Vitals', patient_type: 'both' },
          { id: 3, label_en: 'Warfarin', label_fil: 'Warfarin Clinic', icon_src: 'bxs-capsule', display_order: 3, description_en: 'Anticoagulation Monitoring', description_fil: 'Gamot sa Dugo', patient_type: 'both' },
          { id: 4, label_en: 'OPD Card', label_fil: 'OPD Kard', icon_src: 'bx-id-card', display_order: 4, description_en: 'Card Issuance & Records', description_fil: 'Pagkuha ng Kard', patient_type: 'both' },
          { id: 5, label_en: 'ECG', label_fil: 'ECG', icon_src: 'bx-heart', display_order: 5, description_en: 'Cardiac Rhythm Diagnostics', description_fil: 'Pagsusuri sa Tibok', patient_type: 'both' },
          { id: 6, label_en: 'Refill Prescription', label_fil: 'Reseta', icon_src: 'bx-capsule', display_order: 6, description_en: 'Medication Renewal', description_fil: 'Pag-refill ng Gamot', patient_type: 'both' },
          { id: 7, label_en: 'Benzathine', label_fil: 'Iniksyon', icon_src: 'bx-injection', display_order: 7, description_en: 'Penicillin Therapy', description_fil: 'Iniksyon ng Penicillin', patient_type: 'both' },
          { id: 8, label_en: 'OPD Reschedule', label_fil: 'Pagbago ng Petsa', icon_src: 'bx-calendar', display_order: 8, description_en: 'Follow-up Scheduling', description_fil: 'Bagong Iskedyul', patient_type: 'both' },
        ];
      }

      setServices(finalServices);
      setTodayRawPatients(todayPatients);

      let effectiveStations: FlowchartCubicleStation[] = [...stations];

      // If no cubicles exist in the DB at all (fresh setup), generate representative stations for each resolved service
      if (effectiveStations.length === 0) {
        finalServices.forEach((svc, sIdx) => {
          if (svc.label_en.toLowerCase().includes('consult')) {
            effectiveStations.push(
              { id: 101, cubicleNum: 'R1-C1', category: svc.label_en, assignedDoctor: 'Dr. Santos', status: 'available', idleMinutes: 6, idleRating: 'continuous', totalConsultationsToday: 8, avgSpeedTodayMinutes: 16.5 },
              { id: 102, cubicleNum: 'R1-C2', category: svc.label_en, assignedDoctor: 'Dr. Reyes', status: 'available', idleMinutes: 12, idleRating: 'low-idle', totalConsultationsToday: 6, avgSpeedTodayMinutes: 19.0 },
              { id: 103, cubicleNum: 'R2-C1', category: svc.label_en, assignedDoctor: 'Dr. Cruz', status: 'available', idleMinutes: 4, idleRating: 'continuous', totalConsultationsToday: 11, avgSpeedTodayMinutes: 14.2 },
              { id: 104, cubicleNum: 'R2-C2', category: svc.label_en, assignedDoctor: 'Dr. Dela Cruz', status: 'available', idleMinutes: 8, idleRating: 'continuous', totalConsultationsToday: 9, avgSpeedTodayMinutes: 15.0 },
              { id: 105, cubicleNum: 'R3-C1', category: svc.label_en, assignedDoctor: 'Dr. Aquino', status: 'available', idleMinutes: 9, idleRating: 'continuous', totalConsultationsToday: 7, avgSpeedTodayMinutes: 17.5 },
              { id: 106, cubicleNum: 'R4-C1', category: svc.label_en, assignedDoctor: 'Dr. Morales', status: 'available', idleMinutes: 15, idleRating: 'low-idle', totalConsultationsToday: 5, avgSpeedTodayMinutes: 20.0 }
            );
          } else {
            effectiveStations.push({
              id: (sIdx + 2) * 100 + 1,
              cubicleNum: `${svc.label_en} C1`,
              category: svc.label_en,
              assignedDoctor: 'Clinical Lead',
              status: 'available',
              idleMinutes: 5,
              idleRating: 'continuous',
              totalConsultationsToday: 12,
              avgSpeedTodayMinutes: 8.0,
            });
          }
        });
      }

      const totalCubicles = effectiveStations.length;
      const availableCount = Math.max(0, totalCubicles - occupiedCount);
      const utilizationPercent =
        totalCubicles > 0 ? Math.round((occupiedCount / totalCubicles) * 100) : 0;

      const facilityAvgSpeed =
        totalConsultCountToday > 0
          ? parseFloat(
              (totalConsultDurationsToday / totalConsultCountToday).toFixed(1)
            )
          : 18.0;

      const facilityAvgIdle =
        availableCount > 0 ? Math.round(totalIdleMinutesSum / availableCount) : 0;

      // Update Stages Model
      setStages({
        waiting: {
          key: 'waiting',
          title: '1. Kiosk',
          subtitle: 'Self-service check-in',
          icon: 'bx-devices',
          count: waitingList.length,
          metricLabel: 'Mean Wait Time',
          metricValue: `${meanWaitMinutes}m`,
          avgDurationMinutes: meanWaitMinutes,
          patients: waitingList,
          alertCount: waitingList.filter((p) => p.isStalled).length,
        },
        dispatch: {
          key: 'dispatch',
          title: '2. Registration',
          subtitle: 'Verification counters',
          icon: 'bx-user-check',
          count: dispatchList.length,
          metricLabel: 'Transit Grace',
          metricValue: '<5m grace',
          patients: dispatchList,
          alertCount: dispatchList.filter((p) => p.isStalled).length,
        },
        examination: {
          key: 'examination',
          title: '3. Nurse',
          subtitle: 'Clinical service stations',
          icon: 'bx-first-aid',
          count: examList.length,
          metricLabel: 'Active Rooms',
          metricValue: `${occupiedCount} / ${totalCubicles}`,
          patients: examList,
          alertCount: examList.filter((p) => p.isStalled).length,
        },
        carryout: {
          key: 'carryout',
          title: '4. Carryout',
          subtitle: 'Post-consultation instructions',
          icon: 'bx-file-blank',
          count: carryoutList.length,
          metricLabel: 'Mean Carryout',
          metricValue: `${meanCarryoutMinutes}m`,
          avgDurationMinutes: meanCarryoutMinutes,
          patients: carryoutList,
        },
        completed: {
          key: 'completed',
          title: '5. Finished',
          subtitle: 'Completed & discharged',
          icon: 'bx-check-double',
          count: completedList.length,
          metricLabel: 'Today Served',
          metricValue: `${completedList.length} pts`,
          patients: completedList,
        },
      });

      setCubicleStations(effectiveStations);

      setKpis({
        totalInPipeline:
          waitingList.length + dispatchList.length + examList.length + carryoutList.length,
        waitingCount: waitingList.length,
        dispatchCount: dispatchList.length,
        activeExamCount: examList.length,
        carryoutCount: carryoutList.length,
        completedTodayCount: completedList.length,
        idleCubiclesCount: availableCount,
        availableCubiclesCount: availableCount,
        totalCubiclesCount: totalCubicles,
        facilityUtilizationPercent: utilizationPercent,
        facilityAvgSpeedMinutes: facilityAvgSpeed,
        facilityAvgIdleMinutes: facilityAvgIdle,
      });
    } catch (err: any) {
      console.error('Flowchart pipeline data fetch failed:', err);
      setError(err.message || 'Failed to compute flowchart pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlowchartData();

    // 1-minute clock tick for live countdowns
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, CUBICLES_CLOCK_INTERVAL_MS);

    // 30-second polling fallback for active queue transitions
    const pollTimer = setInterval(() => {
      fetchFlowchartData();
    }, CUBICLES_REFRESH_INTERVAL_MS);

    // Live Supabase WebSocket channel subscribing to all patient stage transitions
    const channel = supabase
      .channel(`flowchart-patients-live-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          fetchFlowchartData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(clockTimer);
      clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchFlowchartData]);

  return {
    stages,
    cubicleStations,
    services,
    todayRawPatients,
    kpis,
    currentTime,
    loading,
    error,
    selectedInspection,
    setSelectedInspection,
    refresh: fetchFlowchartData,
  };
}
