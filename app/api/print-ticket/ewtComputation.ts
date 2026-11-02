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
 * - Sanitized return value clamped within safe bounds [5, 240] minutes.
 *
 * @module app/api/print-ticket/ewtComputation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getTimestamp } from '@/lib/logger';
import { manilaDayRange } from '@/utils/manilaDayRange';
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

/** Default fallback duration in minutes for clinical consultations. */
const FALLBACK_AVG_DURATION_MINUTES = 15;

/** Default fallback duration in minutes for intake/registration counter. */
const FALLBACK_REGISTRATION_DURATION_MINUTES = 5;

/** Minimum wait time returned in minutes. */
const MIN_EWT_MINUTES = 5;

/** Maximum wait time returned in minutes (4 hours cap for severe queue pile-ups). */
const MAX_EWT_MINUTES = 240;

/** Standard operational buffer in minutes between patient calls. */
const STANDARD_BUFFER_MINUTES = 5;

/** Extended buffer in minutes when doctor stations have not yet initiated intake. */
const COLD_START_BUFFER_MINUTES = 15;

/** Active waiting statuses in the OPD queue. */
const WAITING_STATUSES = [
  'Waiting',
  'On Progress',
  'Assigned',
  'waiting',
  'on progress',
  'assigned',
];

/** Statuses indicating a patient is actively being attended or examined. */
const IN_SERVICE_STATUSES = [
  'With Doctor',
  'Carryout',
  'Consulting',
  'Serving',
  'serving',
  'with doctor',
  'carryout',
];

/** Statuses indicating consultation intake has commenced today. */
const INTAKE_COMMENCED_STATUSES = [
  'With Doctor',
  'Carryout',
  'Done',
  'with doctor',
  'carryout',
  'done',
];

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
 * @param supabase - Supabase client instance with read permissions on patients and cubicles.
 * @param service - Name of the clinical service (e.g. 'Consultation', 'Adult Cardiology').
 * @param patientCreatedAt - ISO timestamp of when the patient ticket record was created.
 * @param subcategory - Optional demographic or triage subcategory (e.g. 'Adult', 'Pediatric').
 * @returns Object containing the calculated wait minutes and calculation factors.
 *
 * @remarks
 * Formula:
 * EWT = ((positionAhead / activeServers) * avgDurationMinutes) + bufferMinutes
 * Clamped between 5 and 240 minutes, then rounded to the nearest 5-minute interval.
 */
export async function computeEstimatedWaitMinutes(
  supabase: SupabaseClient,
  service: string,
  patientCreatedAt?: string | null,
  subcategory?: string | null
): Promise<EwtCalculationResult> {
  const cleanService = (service || '').trim();
  const cleanSubcategory = subcategory ? subcategory.trim() : null;
  const nowMs = Date.now();
  const today = manilaDayRange(nowMs);
  const startOfDayIso = today.start;
  const endOfDayIso = today.end;
  const referenceCreatedAt = patientCreatedAt || new Date(nowMs).toISOString();

  try {
    // 1. Calculate live queue depth ahead in this service lane
    let positionQuery = supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('service', cleanService)
      .in('status', WAITING_STATUSES)
      .eq('is_historical', false)
      .gte('created_at', startOfDayIso)
      .lt('created_at', referenceCreatedAt);

    if (cleanSubcategory && cleanSubcategory !== '---') {
      positionQuery = positionQuery.eq('subcategory', cleanSubcategory);
    }

    const { count: positionCount, error: countError } = await positionQuery;
    if (countError) {
      console.warn(
        `${getTimestamp()} [EWT COMPUTATION] Failed to query position ahead: ${countError.message}`
      );
    }
    const positionAhead = Math.max(positionCount ?? 0, 0);

    // 2. Query active serving stations (cubicles / counters)
    const isRegistration = cleanService.toLowerCase() === 'registration';
    let openStationCount = 0;

    if (isRegistration) {
      const { count: counterCount, error: counterError } = await supabase
        .from('counters')
        .select('counter_number', { count: 'exact', head: true })
        .eq('active', true);

      if (!counterError && typeof counterCount === 'number') {
        openStationCount = counterCount;
      }
    } else {
      let cubicleQuery = supabase
        .from('cubicle')
        .select('id', { count: 'exact', head: true })
        .eq('category', cleanService)
        .eq('on_break', false);

      if (cleanSubcategory && cleanSubcategory !== '---') {
        cubicleQuery = cubicleQuery.eq('subcategory', cleanSubcategory);
      }

      const { count: cubicleCount, error: cubicleError } = await cubicleQuery;
      if (!cubicleError && typeof cubicleCount === 'number') {
        openStationCount = cubicleCount;
      }
    }

    // Also count patients actively in progress / in consultation right now
    let inProgressQuery = supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('service', cleanService)
      .in('status', IN_SERVICE_STATUSES)
      .eq('is_historical', false)
      .gte('created_at', startOfDayIso)
      .lt('created_at', endOfDayIso);

    if (cleanSubcategory && cleanSubcategory !== '---') {
      inProgressQuery = inProgressQuery.eq('subcategory', cleanSubcategory);
    }

    const { count: activeCount, error: activeError } = await inProgressQuery;
    if (activeError) {
      console.warn(
        `${getTimestamp()} [EWT COMPUTATION] Failed to query active patients in consultation: ${activeError.message}`
      );
    }
    const currentlyServing = Math.max(activeCount ?? 0, 0);

    // Divisor: use open stations, actively serving patients, or at least 1 server
    const effectiveServers = Math.max(openStationCount, currentlyServing, 1);

    // 3. Determine dynamic buffer (cold-start vs standard)
    let intakeQuery = supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('service', cleanService)
      .in('status', INTAKE_COMMENCED_STATUSES)
      .eq('is_historical', false)
      .gte('created_at', startOfDayIso)
      .lt('created_at', endOfDayIso);

    if (cleanSubcategory && cleanSubcategory !== '---') {
      intakeQuery = intakeQuery.eq('subcategory', cleanSubcategory);
    }

    const { count: intakeCount, error: intakeError } = await intakeQuery;
    if (intakeError) {
      console.warn(
        `${getTimestamp()} [EWT COMPUTATION] Failed to check intake status: ${intakeError.message}`
      );
    }

    const hasIntakeStarted = (intakeCount ?? 0) > 0 || currentlyServing > 0;
    const buffer = hasIntakeStarted ? STANDARD_BUFFER_MINUTES : COLD_START_BUFFER_MINUTES;

    // 4. Compute rolling average duration for completed visits in this service
    const defaultDuration = isRegistration
      ? FALLBACK_REGISTRATION_DURATION_MINUTES
      : FALLBACK_AVG_DURATION_MINUTES;
    let rollingAvgDuration = defaultDuration;

    const startField = isRegistration ? 'reg_start' : 'consult_start';
    const endField = isRegistration ? 'reg_end' : 'consult_end';

    let durationQuery = supabase
      .from('patients')
      .select(`${startField}, ${endField}`)
      .eq('service', cleanService)
      .eq('is_historical', false)
      .not(startField, 'is', null)
      .not(endField, 'is', null)
      .order(endField, { ascending: false })
      .limit(30);

    if (cleanSubcategory && cleanSubcategory !== '---') {
      durationQuery = durationQuery.eq('subcategory', cleanSubcategory);
    }

    const { data: recentCompleted, error: durationError } = await durationQuery;

    if (!durationError && Array.isArray(recentCompleted) && recentCompleted.length >= 3) {
      const validDurations: number[] = [];
      for (const row of recentCompleted) {
        if (!row || typeof row !== 'object') continue;
        const startVal = (row as Record<string, unknown>)[startField];
        const endVal = (row as Record<string, unknown>)[endField];
        if (typeof startVal !== 'string' || typeof endVal !== 'string') continue;

        const startMs = new Date(startVal).getTime();
        const endMs = new Date(endVal).getTime();
        const durationMin = (endMs - startMs) / (1000 * 60);

        // Filter out extreme outliers (less than 1 min or greater than 90 mins)
        if (durationMin >= 1 && durationMin <= 90) {
          validDurations.push(durationMin);
        }
      }

      if (validDurations.length >= 3) {
        const sum = validDurations.reduce((acc, val) => acc + val, 0);
        rollingAvgDuration = Math.round((sum / validDurations.length) * 10) / 10;
      }
    }

    // 5. Compute formula: EWT = ((queueAhead / servers) * avgDuration) + buffer
    const queueMinutes = (positionAhead / effectiveServers) * rollingAvgDuration;
    const rawEwt = queueMinutes + buffer;

    // 6. Clamp between MIN and MAX, then round up to nearest 5-minute interval
    const clampedEwt = Math.min(Math.max(rawEwt, MIN_EWT_MINUTES), MAX_EWT_MINUTES);
    const roundedEwt = Math.ceil(clampedEwt / 5) * 5;

    console.log(`${getTimestamp()} [EWT COMPUTATION] Resolved:`, {
      service: cleanService,
      subcategory: cleanSubcategory,
      positionAhead,
      openStations: openStationCount,
      currentlyServing,
      activeServers: effectiveServers,
      avgDuration: rollingAvgDuration,
      hasIntakeStarted,
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
