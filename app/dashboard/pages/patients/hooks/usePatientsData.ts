/**
 * @fileoverview Custom React hook for fetching patient records, real-time statistics,
 * service distribution, and 30-day historical logs.
 *
 * @module app/dashboard/pages/patients/hooks/usePatientsData
 */

import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PatientStats, RecentPatient, AllRecentPatient } from '@/types/Types';

const RECENT_LIST_SIZE = 20;
const PATIENT_COLUMNS = 'id, patientNum, service, status, created_at, consult_start';

/**
 * Manages patient queries for both today and the trailing 30-day window,
 * optionally filtered by a specific department/service.
 *
 * @param setStats - State dispatcher to sync summary metric numbers.
 * @param service - Optional service name to filter patient records (null = All Services).
 * @returns Object containing recent patient lists, distribution mix, errors, and fetch trigger.
 */
export function usePatientData(
  setStats: React.Dispatch<React.SetStateAction<PatientStats>>,
  service: string | null = null
) {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [allRecentPatients, setAllRecentPatients] = useState<AllRecentPatient[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow response for the previous chip overwriting the current one
  const requestIdRef = useRef(0);

  const fetchPatientData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    try {
      setError(null);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // No .limit() here: the stat cards are computed from these rows,
      // so capping at 20 undercounted any day with more than 20 patients
      let todayQuery = supabase
        .from('patients')
        .select(PATIENT_COLUMNS)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false });

      let allQuery = supabase
        .from('patients')
        .select(PATIENT_COLUMNS)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (service) {
        todayQuery = todayQuery.ilike('service', service);
        allQuery = allQuery.ilike('service', service);
      }

      const [
        { data: todayPatientData, error: todayError },
        { data: allPatientData },
      ] = await Promise.all([todayQuery, allQuery]);

      if (isStale()) return;
      if (todayError) throw todayError;

      let inQueueCount = 0;
      let inServiceCount = 0;
      let servedCount = 0;
      let totalWaitMinutes = 0;
      let patientsWithWait = 0;

      const distribution: { [key: string]: number } = {};

      if (todayPatientData) {
        todayPatientData.forEach((patient: any) => {
          const status = (patient.status || '').toLowerCase();

          // Wait time calculation: from registration (created_at) until consultation started
          if (patient.created_at) {
            const registeredTime = new Date(patient.created_at).getTime();
            const consultTime = patient.consult_start ? new Date(patient.consult_start).getTime() : now.getTime();
            const waitMinutes = Math.max(0, Math.floor((consultTime - registeredTime) / 60000));
            totalWaitMinutes += waitMinutes;
            patientsWithWait++;
          }

          if (['waiting', 'in queue', 'pending', 'assigned'].includes(status)) {
            inQueueCount++;
          } else if (['in service', 'on progress', 'consulting', 'serving'].includes(status)) {
            inServiceCount++;
          } else if (['completed', 'done', 'served'].includes(status)) {
            servedCount++;
          }

          const serviceName = patient.service || 'Unknown';
          distribution[serviceName] = (distribution[serviceName] || 0) + 1;
        });

        const calculatedAvgWait =
          patientsWithWait > 0 ? Math.round(totalWaitMinutes / patientsWithWait) : 0;

        setStats({
          totalToday: todayPatientData.length,
          inQueue: inQueueCount,
          inService: inServiceCount,
          servedToday: servedCount,
          avgWaitTime: calculatedAvgWait,
        });

        setRecentPatients(todayPatientData.slice(0, RECENT_LIST_SIZE));

        const distArray = Object.entries(distribution).map(([name, value]) => ({
          name,
          value,
        }));
        setServiceDistribution(distArray);
      }

      if (allPatientData) {
        const transformedAll = allPatientData.map((patient: any) => {
          let calculatedWait = '--';
          if (patient.created_at) {
            const registered = new Date(patient.created_at).getTime();
            const consult = patient.consult_start
              ? new Date(patient.consult_start).getTime()
              : now.getTime();
            calculatedWait = `${Math.max(0, Math.floor((consult - registered) / 60000))}m`;
          }

          return {
            id: patient.id,
            patientNum: patient.patientNum,
            service: patient.service,
            status: patient.status,
            time: new Date(patient.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            waitTime: calculatedWait,
          };
        });

        setAllRecentPatients(transformedAll);
      }
    } catch (err: any) {
      if (!isStale()) {
        console.error('Error fetching patient data:', err);
        setError(err.message || 'Failed to load patient data');
      }
    }
  }, [service, setStats]);

  return { recentPatients, allRecentPatients, serviceDistribution, error, fetchPatientData };
}
