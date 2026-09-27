/**
 * @fileoverview TypeScript type and interface definitions for cubicle queue management.
 *
 * @module app/dashboard/pages/cubicles/types/cubicle
 */

export type CubicleStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

/** Full cubicle status presentation model with associated patient context. */
export interface Cubicle {
  id: number;
  cubicleNum: string;
  category: string;
  status: CubicleStatus;
  patientId?: string;
  service?: string;
  timeOccupied?: Date;
  estimatedEndTime?: Date;
}

/** Raw database record from the `cubicle` table. */
export interface CubicleRecord {
  id: number;
  cubicleNum: string;
  category: string;
}

/** Active patient record mapped to a cubicle assignment. */
export interface PatientRecord {
  id: number;
  patientNum: string;
  service: string;
  status: string;
  cubicleNum: string | null;
  consult_start: string | null;
  created_at: string;
}

/** Aggregate statistics across all facility examination cubicles. */
export interface CubiclesStats {
  total: number;
  available: number;
  occupied: number;
  unavailable: number;
}
