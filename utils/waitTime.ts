/**
 * @fileoverview Wait time calculation utilities for queue and historical analytics.
 *
 * Provides accurate calculation of patient waiting times in minutes, correctly
 * freezing completed tickets at consultation start or completion, and avoiding
 * skew when computing metrics across historical date ranges.
 *
 * @module utils/waitTime
 */

import type { PatientRecord } from '@/app/dashboard/hooks/useOverviewData';

/**
 * Status strings that indicate a patient is no longer actively waiting in the reception queue.
 */
const FREEZE_STATUSES = ['completed', 'done', 'served', 'on progress', 'serving', 'consulting'];

/**
 * Calculates the waiting duration in minutes for an individual patient ticket.
 *
 * @param patient - Patient record containing creation and consultation timestamps.
 * @param currentTime - Current reference date for actively waiting patients.
 * @returns Wait time in minutes (non-negative integer).
 */
export function getPatientWaitTime(patient: PatientRecord, currentTime: Date): number {
  const joined = new Date(patient.created_at).getTime();
  if (isNaN(joined)) return 0;

  const s = (patient.status || '').toLowerCase().trim();

  // If consultation start exists, wait time is precisely when they were called to cubicle
  if (patient.consult_start) {
    const start = new Date(patient.consult_start).getTime();
    if (!isNaN(start) && start >= joined) {
      return Math.max(0, Math.floor((start - joined) / 60000));
    }
  }

  // If completed/served and consult_end or updated_at exists
  if (FREEZE_STATUSES.includes(s)) {
    const fallbackTimestamp = patient.consult_end ?? patient.updated_at;
    if (fallbackTimestamp) {
      const end = new Date(fallbackTimestamp).getTime();
      if (!isNaN(end) && end >= joined) {
        return Math.max(0, Math.floor((end - joined) / 60000));
      }
    }
  }

  // For live tickets created today, calculate active duration against currentTime
  const isCreatedToday =
    new Date(patient.created_at).toDateString() === currentTime.toDateString();

  if (isCreatedToday) {
    return Math.max(0, Math.floor((currentTime.getTime() - joined) / 60000));
  }

  // Historical unserved/incomplete record without timestamps
  return 0;
}

/**
 * Calculates the average wait time across an array of patient records.
 *
 * @param patients - Array of patient records.
 * @param currentTime - Current reference date.
 * @returns Rounded average wait time in minutes as string, or '--' if no valid data.
 */
export function calcAvgWaitTime(patients: PatientRecord[], currentTime: Date): string {
  if (patients.length === 0) return '--';

  let totalMinutes = 0;
  let count = 0;

  for (const patient of patients) {
    const duration = getPatientWaitTime(patient, currentTime);
    if (duration > 0) {
      totalMinutes += duration;
      count++;
    }
  }

  if (count === 0) return '--';
  return Math.round(totalMinutes / count).toString();
}