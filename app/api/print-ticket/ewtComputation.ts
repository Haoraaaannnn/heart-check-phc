/**
 * @file ewtComputation.ts
 * @description Server-side calculation engine for dynamic patient Estimated Wait Time (EWT).
 *
 * Computes queue waiting time projections using a hybrid model:
 * live queue depth ahead, active serving stations, and rolling service duration averages.
 *
 * Security Considerations:
 * - Parameterized Supabase queries prevent SQL injection.
 * - Enforces `is_historical = false` filter on all queries to protect historical research data.
 * - Sanitized return value clamped within safe bounds [5, 180] minutes.
 *
 * @module app/api/print-ticket/ewtComputation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getTimestamp } from '@/lib/logger';
import {
  formatEwtLabel,
  formatEwtReceiptLabel,
  formatEwtSmsLabel,
  EWT_TEXTS,
} from '@/constants/ewtTexts';

export {
  formatEwtLabel,
  formatEwtReceiptLabel,
  formatEwtSmsLabel,
  EWT_TEXTS,
};

/** Default fallback duration in minutes if insufficient historical data exists. */
const FALLBACK_AVG_DURATION_MINUTES = 15;

/** Minimum wait time returned in minutes. */
const MIN_EWT_MINUTES = 5;

/** Maximum wait time returned in minutes (3 hours cap). */
const MAX_EWT_MINUTES = 180;

/** Standard operational buffer in minutes between patient calls. */
const STANDARD_BUFFER_MINUTES = 5;

/** Extended buffer in minutes when doctor stations have not yet initiated intake. */
const COLD_START_BUFFER_MINUTES = 15;

/**
 * Result object returned by the EWT computation utility.
 */
export interface EwtCalculationResult {
  /** The final rounded wait time in minutes (nearest 5-minute increment). */
  estimatedWaitMinutes: number;
  /** Number of active waiting patients ahead in the same service lane. */
  positionAhead: number;
  /** Number of currently active consultation cubicles or counters. */
  activeServers: number;
  /** Rolling average consultation duration in minutes used in the calculation. */
  averageDurationMinutes: number;
}

/**
 * Computes the estimated wait time for a newly queued patient.
 *
 * @param supabase - Supabase client instance with read permissions on patients.
 * @param service - Name of the clinical service (e.g. 'Consultation', 'OPD Screening').
 * @param patientCreatedAt - ISO timestamp of when the patient ticket record was created.
 * @returns Object containing the calculated wait minutes and calculation factors.
 *
 * @remarks
 * Formula:
 * EWT = ((positionAhead / activeServers) * avgDurationMinutes) + bufferMinutes
 * Clamped between 5 and 180 minutes, then rounded to the nearest 5-minute interval.
 */
export async function computeEstimatedWaitMinutes(
  supabase: SupabaseClient,
  service: string,
  patientCreatedAt: string
): Promise<EwtCalculationResult> {
  try {
    const now = new Date();
    // Resolve start of the current calendar day in Manila Standard Time
    const manilaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const startOfDayIso = `${manilaDateStr}T00:00:00+08:00`;

    // 1. Calculate live queue depth ahead in this service lane
    const { count: positionCount, error: countError } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('service', service)
      .eq('status', 'waiting')
      .eq('is_historical', false)
      .gte('created_at', startOfDayIso)
      .lt('created_at', patientCreatedAt);

    if (countError) {
      console.warn(
        `${getTimestamp()} [EWT COMPUTATION] Failed to query position ahead: ${countError.message}`
      );
    }
    const positionAhead = Math.max(positionCount ?? 0, 0);

    // 2. Query currently active servers (stations with patients currently in-progress)
    const { count: activeCount, error: activeError } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('service', service)
      .eq('status', 'in-progress')
      .eq('is_historical', false)
      .gte('created_at', startOfDayIso);

    if (activeError) {
      console.warn(
        `${getTimestamp()} [EWT COMPUTATION] Failed to query active servers: ${activeError.message}`
      );
    }

    const liveActiveServers = activeCount ?? 0;
    // For calculation divisor, assume at least 1 active or upcoming server
    const effectiveServers = Math.max(liveActiveServers, 1);

    // 3. Compute rolling average duration for completed consultations in this service
    let rollingAvgDuration = FALLBACK_AVG_DURATION_MINUTES;
    const { data: recentCompleted, error: durationError } = await supabase
      .from('patients')
      .select('consult_start, consult_end')
      .eq('service', service)
      .eq('is_historical', false)
      .not('consult_start', 'is', null)
      .not('consult_end', 'is', null)
      .order('consult_end', { ascending: false })
      .limit(30);

    if (!durationError && Array.isArray(recentCompleted) && recentCompleted.length >= 3) {
      const validDurations: number[] = [];
      for (const row of recentCompleted) {
        if (!row.consult_start || !row.consult_end) continue;
        const startMs = new Date(row.consult_start).getTime();
        const endMs = new Date(row.consult_end).getTime();
        const durationMin = (endMs - startMs) / (1000 * 60);

        // Filter out extreme outliers (less than 2 mins or greater than 90 mins)
        if (durationMin >= 2 && durationMin <= 90) {
          validDurations.push(durationMin);
        }
      }

      if (validDurations.length >= 3) {
        const sum = validDurations.reduce((acc, val) => acc + val, 0);
        rollingAvgDuration = Math.round((sum / validDurations.length) * 10) / 10;
      }
    }

    // 4. Apply dynamic buffer
    // If no stations have patients currently in-progress, apply cold-start buffer
    const buffer = liveActiveServers === 0 ? COLD_START_BUFFER_MINUTES : STANDARD_BUFFER_MINUTES;

    // 5. Compute formula: EWT = ((queue / servers) * avgDuration) + buffer
    const queueMinutes = (positionAhead / effectiveServers) * rollingAvgDuration;
    const rawEwt = queueMinutes + buffer;

    // 6. Clamp between MIN and MAX, then round to nearest 5-minute interval
    const clampedEwt = Math.min(Math.max(rawEwt, MIN_EWT_MINUTES), MAX_EWT_MINUTES);
    const roundedEwt = Math.ceil(clampedEwt / 5) * 5;

    console.log(`${getTimestamp()} [EWT COMPUTATION] Resolved:`, {
      service,
      positionAhead,
      activeServers: effectiveServers,
      avgDuration: rollingAvgDuration,
      buffer,
      calculatedMinutes: roundedEwt,
    });

    return {
      estimatedWaitMinutes: roundedEwt,
      positionAhead,
      activeServers: effectiveServers,
      averageDurationMinutes: rollingAvgDuration,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${getTimestamp()} [EWT COMPUTATION ERROR] Fallback applied:`, message);
    return {
      estimatedWaitMinutes: FALLBACK_AVG_DURATION_MINUTES,
      positionAhead: 0,
      activeServers: 1,
      averageDurationMinutes: FALLBACK_AVG_DURATION_MINUTES,
    };
  }
}
