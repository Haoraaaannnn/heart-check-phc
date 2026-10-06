/**
 * @fileoverview Custom React hook for fetching patient records, real-time statistics,
 * service distribution, 30-day historical logs, and debounced multi-field patient search.
 *
 * Implements comprehensive search supporting lookup by hospital Patient Number (patientNum),
 * ticket number, database ID, and contact phone number with race-condition guards and
 * seamless fallbacks.
 *
 * @module app/dashboard/pages/patients/hooks/usePatientsData
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PatientStats, RecentPatient, AllRecentPatient } from '@/types/Types';

const RECENT_LIST_SIZE = 20;
const PATIENT_COLUMNS = 'id, patientNum, service, status, created_at, consult_start, phoneNum';

/**
 * Return signature of the {@link usePatientData} hook.
 */
export interface UsePatientDataReturn {
  /** Array of active patients registered today for quick feed or dashboard cards. */
  recentPatients: RecentPatient[];
  /** Full list of recent patients (or matching search results when query is active). */
  allRecentPatients: AllRecentPatient[];
  /** Breakdown of today's patient volume across clinical departments. */
  serviceDistribution: { name: string; value: number }[];
  /** Network or query error message, or null if healthy. */
  error: string | null;
  /** Triggers a fresh query of today's metrics and trailing 30-day records. */
  fetchPatientData: () => Promise<void>;
  /** Current search input string across ID, ticket, and phone. */
  searchQuery: string;
  /** Sets the search query, scheduling a debounced server/client lookup. */
  setSearchQuery: (query: string) => void;
  /** Flag indicating whether a debounced search query is actively in flight. */
  isSearching: boolean;
  /** Clears the active search query and restores the baseline 30-day patient list. */
  clearSearch: () => void;
  /** Total count of matching records found during an active search, or undefined if idle. */
  matchCount?: number;
}

/**
 * Normalizes raw database phone numbers into human-readable mobile format.
 *
 * @param rawPhone - Raw integer or string value from the database.
 * @returns Formatted phone number string (e.g. "09171234567") or null if empty.
 */
function formatPhoneNumber(rawPhone: unknown): string | null {
  if (rawPhone === null || rawPhone === undefined || rawPhone === '') return null;
  const str = String(rawPhone).trim();
  if (!str || str === '0') return null;
  if (str.startsWith('enc:v1:')) {
    return 'Protected';
  }
  if (/^\d{10}$/.test(str)) {
    return `0${str}`;
  }
  return str;
}

/**
 * Manages patient queries for both today and the trailing 30-day window,
 * optionally filtered by a specific department/service, with debounced search
 * across patient ID, queue ticket number, and phone number.
 *
 * @param setStats - State dispatcher to sync summary metric numbers.
 * @param service - Optional service name to filter patient records (null = All Services).
 * @returns Object containing patient datasets, distribution mix, search controls, and fetch trigger.
 *
 * @remarks
 * Search queries are debounced at 350ms to protect Supabase from keystroke thrashing.
 * Safe PostgREST filtering ensures numeric fields (`id`, `phoneNum`) are only queried
 * with numeric equality, avoiding PostgreSQL bigint type-cast runtime exceptions.
 */
export function usePatientData(
  setStats: React.Dispatch<React.SetStateAction<PatientStats>>,
  service: string | null = null
): UsePatientDataReturn {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [baselinePatients, setBaselinePatients] = useState<AllRecentPatient[]>([]);
  const [searchResults, setSearchResults] = useState<AllRecentPatient[] | null>(null);
  const [serviceDistribution, setServiceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Search input state and debounce controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Guards against race conditions from asynchronous responses
  const fetchRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);

  // Debounce search query changes by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Fetches baseline metrics for today and 30-day history.
   */
  const fetchPatientData = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    const isStale = () => requestId !== fetchRequestIdRef.current;

    try {
      setError(null);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

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
        { data: allPatientData, error: allError },
      ] = await Promise.all([todayQuery, allQuery]);

      if (isStale()) return;
      if (todayError) throw todayError;
      if (allError) throw allError;

      let inQueueCount = 0;
      let inServiceCount = 0;
      let servedCount = 0;
      let totalWaitMinutes = 0;
      let patientsWithWait = 0;

      const distribution: { [key: string]: number } = {};

      if (todayPatientData) {
        todayPatientData.forEach((patient: any) => {
          const status = (patient.status || '').toLowerCase();

          if (patient.created_at) {
            const registeredTime = new Date(patient.created_at).getTime();
            const consultTime = patient.consult_start
              ? new Date(patient.consult_start).getTime()
              : now.getTime();
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

        const transformedToday: RecentPatient[] = todayPatientData
          .slice(0, RECENT_LIST_SIZE)
          .map((patient: any) => {
            const waitMin =
              patient.consult_start && patient.created_at
                ? Math.max(
                    0,
                    Math.floor(
                      (new Date(patient.consult_start).getTime() -
                        new Date(patient.created_at).getTime()) /
                        60000
                    )
                  )
                : undefined;

            const createdAtDate = patient.created_at ? new Date(patient.created_at) : new Date();

            return {
              id: String(patient.id),
              patientNum: patient.patientNum || '',
              service: patient.service || 'Unknown',
              status: patient.status || 'Unknown',
              createdAt: createdAtDate.toLocaleString(),
              time: patient.created_at
                ? new Date(patient.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--',
              waitTime: waitMin,
              phoneNum: formatPhoneNumber(patient.phoneNum),
              rawPhone: patient.phoneNum,
            };
          });

        setRecentPatients(transformedToday);

        const distArray = Object.entries(distribution).map(([name, value]) => ({
          name,
          value,
        }));
        setServiceDistribution(distArray);
      } else {
        setRecentPatients([]);
        setServiceDistribution([]);
      }

      if (allPatientData) {
        const transformedAll: AllRecentPatient[] = allPatientData.map((patient: any) => {
          let calculatedWait = '--';
          if (patient.created_at) {
            const registered = new Date(patient.created_at).getTime();
            const consult = patient.consult_start
              ? new Date(patient.consult_start).getTime()
              : now.getTime();
            calculatedWait = `${Math.max(0, Math.floor((consult - registered) / 60000))}m`;
          }

          const createdAtDate = patient.created_at ? new Date(patient.created_at) : new Date();

          return {
            id: String(patient.id),
            patientNum: patient.patientNum || '',
            service: patient.service || 'Unknown',
            status: patient.status || 'Unknown',
            createdAt: createdAtDate.toLocaleString(),
            createdAtDate,
            time: patient.created_at
              ? new Date(patient.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--',
            waitTime: calculatedWait,
            phoneNum: formatPhoneNumber(patient.phoneNum),
            rawPhone: patient.phoneNum,
          };
        });

        setBaselinePatients(transformedAll);
      } else {
        setBaselinePatients([]);
      }
    } catch (err: any) {
      if (!isStale()) {
        console.error('Error fetching patient data:', err);
        setError(err.message || 'Failed to load patient data');
        setRecentPatients([]);
        setBaselinePatients([]);
        setServiceDistribution([]);
      }
    }
  }, [service, setStats]);

  /**
   * Executes multi-field debounced patient search across ID, Ticket Number, and Phone Number.
   */
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const searchRequestId = ++searchRequestIdRef.current;
    const isStale = () => searchRequestId !== searchRequestIdRef.current;

    async function executeSearch() {
      setIsSearching(true);
      try {
        const cleanTerm = trimmed.replace(/[,()]/g, '');
        const digitsOnly = trimmed.replace(/\D/g, '');
        const now = new Date();

        let query = supabase
          .from('patients')
          .select(PATIENT_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(100);

        if (service) {
          query = query.ilike('service', service);
        }

        const orConditions: string[] = [];

        // 1. Ticket search via patientNum
        if (cleanTerm) {
          orConditions.push(`patientNum.ilike.%${cleanTerm}%`);
        }

        // 2. Numeric searches (ID and Phone) strictly guarded to prevent bigint cast errors
        if (digitsOnly.length > 0 && digitsOnly.length <= 15) {
          const idNum = Number(digitsOnly);
          if (Number.isSafeInteger(idNum) && idNum > 0) {
            orConditions.push(`id.eq.${idNum}`);
          }
        }

        if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
          const exactPhone = Number(digitsOnly);
          if (Number.isSafeInteger(exactPhone)) {
            orConditions.push(`phoneNum.eq.${exactPhone}`);
          }
          if (digitsOnly.startsWith('0')) {
            const strippedPhone = Number(digitsOnly.slice(1));
            if (Number.isSafeInteger(strippedPhone)) {
              orConditions.push(`phoneNum.eq.${strippedPhone}`);
            }
          }
        }

        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','));
        }

        const { data: searchRows, error: searchError } = await query;

        if (isStale()) return;
        if (searchError) {
          console.warn('Database search error, falling back to client filter:', searchError);
        }

        // Transform server search results
        const transformedServer: AllRecentPatient[] = (searchRows || []).map((patient: any) => {
          let calculatedWait = '--';
          if (patient.created_at) {
            const registered = new Date(patient.created_at).getTime();
            const consult = patient.consult_start
              ? new Date(patient.consult_start).getTime()
              : now.getTime();
            calculatedWait = `${Math.max(0, Math.floor((consult - registered) / 60000))}m`;
          }

          const createdAtDate = patient.created_at ? new Date(patient.created_at) : new Date();

          return {
            id: String(patient.id),
            patientNum: patient.patientNum || '',
            service: patient.service || 'Unknown',
            status: patient.status || 'Unknown',
            createdAt: createdAtDate.toLocaleString(),
            createdAtDate,
            time: patient.created_at
              ? new Date(patient.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--',
            waitTime: calculatedWait,
            phoneNum: formatPhoneNumber(patient.phoneNum),
            rawPhone: patient.phoneNum,
          };
        });

        // Complement with instant substring matches on baseline loaded patients
        const queryLower = trimmed.toLowerCase();
        const clientMatches = baselinePatients.filter((p) => {
          const ticket = (p.patientNum || '').toLowerCase();
          const patientId = String(p.id || '').toLowerCase();
          const sName = (p.service || '').toLowerCase();
          const status = (p.status || '').toLowerCase();
          const rawPhone = p.phoneNum ? String(p.phoneNum).replace(/\D/g, '') : '';

          return (
            ticket.includes(queryLower) ||
            patientId.includes(queryLower) ||
            sName.includes(queryLower) ||
            status.includes(queryLower) ||
            (digitsOnly && rawPhone.includes(digitsOnly))
          );
        });

        // Merge server and client records without duplicates
        const resultMap = new Map<string, AllRecentPatient>();
        transformedServer.forEach((p) => resultMap.set(p.id, p));
        clientMatches.forEach((p) => {
          if (!resultMap.has(p.id)) {
            resultMap.set(p.id, p);
          }
        });

        setSearchResults(Array.from(resultMap.values()));
      } catch (err: any) {
        if (!isStale()) {
          console.error('Failed to execute patient search:', err);
        }
      } finally {
        if (!isStale()) {
          setIsSearching(false);
        }
      }
    }

    executeSearch();
  }, [debouncedQuery, service, baselinePatients]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults(null);
    setIsSearching(false);
  }, []);

  const activePatients = searchResults !== null ? searchResults : baselinePatients;
  const matchCount = searchResults !== null ? searchResults.length : undefined;

  return {
    recentPatients,
    allRecentPatients: activePatients,
    serviceDistribution,
    error,
    fetchPatientData,
    searchQuery,
    setSearchQuery,
    isSearching,
    clearSearch,
    matchCount,
  };
}

