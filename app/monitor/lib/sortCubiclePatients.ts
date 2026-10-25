/**
 * @fileoverview Patient queue prioritization and ordering helper for TV queue monitors.
 *
 * Sorts patients assigned to a workstation or cubicle by clinical activity stage:
 * 1. Active clinical consultation/procedure (With Doctor) -> primary Now Serving
 * 2. Active nursing carryout procedure (Carryout) -> secondary Now Serving
 * 3. Assigned ticket waiting in hallway (Assigned / Called) -> Next in Queue
 *
 * Within the same clinical stage, patients are sorted chronologically by called_at
 * or intake timestamp.
 *
 * @module app/monitor/lib/sortCubiclePatients
 */

import { Patient } from '@/types/Types';

/**
 * Normalizes and ranks patient status for public waiting area display.
 * Lower numerical rank indicates higher display priority.
 *
 * @param status - The raw patient status string from the database.
 * @returns Numerical priority rank (1 = highest priority).
 */
export function getPatientStageRank(status?: string): number {
  if (!status) return 4;
  const s = status.toLowerCase().trim();
  if (s === 'with doctor' || s === 'with_doctor' || s === 'withdoctor') return 1;
  if (s === 'carryout' || s === 'carry out' || s === 'carry_out') return 2;
  if (s === 'assigned' || s === 'called') return 3;
  return 4;
}

/**
 * Sorts a roster of cubicle patients by clinical precedence and arrival/call timestamps.
 *
 * @param patients - Array of patient records associated with a specific cubicle.
 * @returns Newly sorted array of patients with active patients first, followed by upcoming tickets.
 */
export function sortCubiclePatients(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const rankA = getPatientStageRank(a.status);
    const rankB = getPatientStageRank(b.status);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const timeA = a.called_at ? new Date(a.called_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
    const timeB = b.called_at ? new Date(b.called_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
    return timeA - timeB;
  });
}
