/**
 * @fileoverview Wait time calculation utilities for queue and historical analytics.
 *
 * Provides accurate calculation of patient waiting times in seconds and minutes, correctly
 * freezing completed tickets at consultation start or completion, and formatting duration
 * strings into standard HH:MM:SS and HH:MM representations.
 *
 * @module utils/waitTime
 */

import type { PatientRecord } from '@/app/dashboard/hooks/useOverviewData';

/**
 * Status strings that indicate a patient is no longer actively waiting in the reception queue.
 */
export const FREEZE_STATUSES = [
  'completed',
  'done',
  'served',
  'on progress',
  'serving',
  'consulting',
  'with doctor',
];

/**
 * Resolves the timestamp when a patient ceased active waiting in queue.
 *
 * @param patient - Patient record.
 * @returns ISO timestamp string or null if still waiting.
 */
export function getPatientWaitEndTime(patient: PatientRecord): string | null {
  const s = (patient.status || '').toLowerCase().trim();

  // Consultation start marks the exact moment patient departed the waiting queue
  if (patient.consult_start) {
    return patient.consult_start;
  }

  // Fallback for completed/served tickets
  if (FREEZE_STATUSES.includes(s)) {
    return patient.consult_end ?? patient.updated_at ?? null;
  }

  return null;
}

/**
 * Calculates the waiting duration in exact seconds for an individual patient ticket.
 *
 * @param patient - Patient record containing creation and consultation timestamps.
 * @param currentTime - Current reference date for actively waiting patients.
 * @returns Wait time in seconds (non-negative integer).
 */
export function getPatientWaitSeconds(patient: PatientRecord, currentTime: Date): number {
  const joined = new Date(patient.created_at).getTime();
  if (isNaN(joined)) return 0;

  const s = (patient.status || '').toLowerCase().trim();

  // If consultation start exists, wait time is precisely when called to cubicle
  if (patient.consult_start) {
    const start = new Date(patient.consult_start).getTime();
    if (!isNaN(start) && start >= joined) {
      return Math.max(0, Math.floor((start - joined) / 1000));
    }
  }

  // If completed/served and consult_end or updated_at exists
  if (FREEZE_STATUSES.includes(s)) {
    const fallbackTimestamp = patient.consult_end ?? patient.updated_at;
    if (fallbackTimestamp) {
      const end = new Date(fallbackTimestamp).getTime();
      if (!isNaN(end) && end >= joined) {
        return Math.max(0, Math.floor((end - joined) / 1000));
      }
    }
  }

  // For live tickets created today, calculate active duration against currentTime
  const isCreatedToday =
    new Date(patient.created_at).toDateString() === currentTime.toDateString();

  if (isCreatedToday) {
    return Math.max(0, Math.floor((currentTime.getTime() - joined) / 1000));
  }

  // Historical unserved/incomplete record without timestamps
  return 0;
}

/**
 * Calculates the waiting duration in minutes for an individual patient ticket.
 *
 * @param patient - Patient record containing creation and consultation timestamps.
 * @param currentTime - Current reference date for actively waiting patients.
 * @returns Wait time in minutes (non-negative integer).
 */
export function getPatientWaitTime(patient: PatientRecord, currentTime: Date): number {
  return Math.floor(getPatientWaitSeconds(patient, currentTime) / 60);
}

/**
 * Formats an individual patient's wait duration into standard HH:MM:SS or HH:MM string.
 *
 * @param patient - Patient record.
 * @param currentTime - Current reference date.
 * @param includeSeconds - Whether to include seconds (defaults to true).
 * @returns Formatted time string (e.g. "00:15:30" or "00:15").
 */
export function formatPatientWaitTime(
  patient: PatientRecord,
  currentTime: Date,
  includeSeconds = true
): string {
  const totalSecs = getPatientWaitSeconds(patient, currentTime);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (includeSeconds) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(hrs)}:${pad(mins)}`;
}

/**
 * Calculates the average wait time across an array of patient records in standard HH:MM:SS format.
 *
 * @param patients - Array of patient records.
 * @param currentTime - Current reference date.
 * @param includeSeconds - Whether to include seconds in the output string (defaults to true).
 * @returns Formatted average wait time (e.g. "00:14:25" or "00:14"), or '--' if no valid data.
 */
export function calcAvgWaitTime(
  patients: PatientRecord[],
  currentTime: Date,
  includeSeconds = true
): string {
  if (patients.length === 0) return '--';

  let totalSeconds = 0;
  let count = 0;

  for (const patient of patients) {
    const duration = getPatientWaitSeconds(patient, currentTime);
    if (duration > 0) {
      totalSeconds += duration;
      count++;
    }
  }

  if (count === 0) return includeSeconds ? '00:00:00' : '00:00';

  const avgSecs = Math.round(totalSeconds / count);
  const hrs = Math.floor(avgSecs / 3600);
  const mins = Math.floor((avgSecs % 3600) / 60);
  const secs = avgSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (includeSeconds) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(hrs)}:${pad(mins)}`;
}