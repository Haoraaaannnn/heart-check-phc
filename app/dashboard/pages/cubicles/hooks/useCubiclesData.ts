/**
 * @fileoverview Custom React hook for fetching and polling real-time cubicle statuses
 * and patient occupancies from Supabase.
 *
 * @module app/dashboard/pages/cubicles/hooks/useCubiclesData
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Cubicle,
  CubicleRecord,
  PatientRecord,
  CubiclesStats,
} from '@/app/dashboard/pages/cubicles/types/cubicle';
import {
  CUBICLES_REFRESH_INTERVAL_MS,
  CUBICLES_CLOCK_INTERVAL_MS,
  AVG_CONSULTATION_MINUTES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';

const EMPTY_STATS: CubiclesStats = {
  total: 0,
  available: 0,
  occupied: 0,
  unavailable: 0,
};

/**
 * Manages live cubicle state, active patient assignments, and periodic synchronization.
 *
 * @returns State object with cubicles list, aggregate stats, current clock timestamp, and loading status.
 */
export function useCubiclesData() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [stats, setStats] = useState<CubiclesStats>(EMPTY_STATS);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCubicleData = useCallback(async () => {
    try {
      setError(null);

      // Fetch all configured cubicles
      const { data: cubicleData, error: cubicleError } = await supabase
        .from('cubicle')
        .select('*')
        .order('id', { ascending: true });

      if (cubicleError) {
        throw cubicleError;
      }

      // Fetch active patients currently in consultation
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, cubicleNum, consult_start, created_at')
        .in('status', ['On Progress', 'Consulting', 'Serving', 'serving', 'in service'])
        .not('cubicleNum', 'is', null);

      if (patientError) {
        console.warn('Error fetching active cubicle patients:', patientError);
      }

      const patientMap = new Map<string, PatientRecord>();
      if (patientData) {
        patientData.forEach((patient: any) => {
          if (patient.cubicleNum) {
            patientMap.set(patient.cubicleNum, patient);
          }
        });
      }

      const cubicleStatuses: Cubicle[] = [];

      if (cubicleData && cubicleData.length > 0) {
        cubicleData.forEach((cubicle: CubicleRecord) => {
          const patient = patientMap.get(cubicle.cubicleNum);
          let status: Cubicle['status'] = 'available';
          let patientId: string | undefined;
          let service: string | undefined;
          let timeOccupied: Date | undefined;
          let estimatedEndTime: Date | undefined;

          if (patient) {
            status = 'occupied';
            patientId = patient.patientNum;
            service = patient.service;
            timeOccupied = patient.consult_start
              ? new Date(patient.consult_start)
              : new Date(patient.created_at);

            if (timeOccupied) {
              estimatedEndTime = new Date(
                timeOccupied.getTime() + AVG_CONSULTATION_MINUTES * 60000
              );
            }
          }

          cubicleStatuses.push({
            id: cubicle.id,
            cubicleNum: cubicle.cubicleNum,
            category: cubicle.category || 'General',
            status,
            patientId,
            service,
            timeOccupied,
            estimatedEndTime,
          });
        });
      }

      setCubicles(cubicleStatuses);

      const computedStats: CubiclesStats = {
        total: cubicleStatuses.length,
        available: cubicleStatuses.filter((c) => c.status === 'available').length,
        occupied: cubicleStatuses.filter((c) => c.status === 'occupied').length,
        unavailable: cubicleStatuses.filter(
          (c) => c.status !== 'available' && c.status !== 'occupied'
        ).length,
      };

      setStats(computedStats);
    } catch (err: any) {
      console.error('Error fetching cubicle data:', err);
      setError(err.message || 'Failed to load cubicle data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCubicleData();

    // Minute clock tick for live remaining times
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, CUBICLES_CLOCK_INTERVAL_MS);

    // 30-second data polling
    const refreshTimer = setInterval(() => {
      fetchCubicleData();
    }, CUBICLES_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
    };
  }, [fetchCubicleData]);

  return { cubicles, stats, currentTime, loading, error, refresh: fetchCubicleData };
}
