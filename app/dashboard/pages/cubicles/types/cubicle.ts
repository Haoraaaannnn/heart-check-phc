/**
 * @fileoverview TypeScript type and interface definitions for cubicle queue management.
 *
 * @module app/dashboard/pages/cubicles/types/cubicle
 */

import type { Service } from '@/types/Services';

export type CubicleStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

/** Dynamic clinical service block entity for the flowchart process graph. */
export interface FlowchartServiceBlock {
  id: number | string;
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  badgeClass: string;
  accentColor: string;
  displayOrder: number;
  stations: FlowchartCubicleStation[];
}

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

/** Heatmap visualization perspective mode. */
export type HeatmapViewMode = 'speed' | 'idle' | 'dual';

/** Categorical speed performance rating for patient processing duration. */
export type SpeedRating = 'fast' | 'optimal' | 'moderate' | 'slow' | 'inactive';

/** Categorical idle interval rating for cubicle downtime. */
export type IdleRating = 'continuous' | 'low-idle' | 'moderate-idle' | 'high-idle' | 'dormant';

/** Record of an individual patient consultation intersecting an operational hour. */
export interface HeatmapPatientItem {
  id: number;
  patientNum: string;
  service: string;
  consultStart: string;
  consultEnd: string | null;
  durationMinutes: number;
  status: string;
}

/** Computed analytical data for an individual cubicle x operational hour cell. */
export interface HeatmapCellData {
  cubicleNum: string;
  hour: string;
  hourLabel: string;
  timeSlotLabel: string;
  patientsCount: number;
  patients: HeatmapPatientItem[];
  totalActiveMinutes: number;
  idleMinutes: number;
  occupancyPercent: number;
  avgSpeedMinutes: number;
  speedRating: SpeedRating;
  idleRating: IdleRating;
  isUpcoming: boolean;
  isCurrentHour: boolean;
}

/** Row presentation model representing an examination cubicle and its hourly slots. */
export interface HeatmapRowData {
  cubicleId: number;
  cubicleNum: string;
  category: string;
  assignedDoctor?: string;
  liveStatus: CubicleStatus;
  cells: Record<string, HeatmapCellData>;
  dailyTotalPatients: number;
  dailyAvgSpeedMinutes: number;
  dailyTotalActiveMinutes: number;
  dailyTotalIdleMinutes: number;
  dailyOccupancyPercent: number;
}

/** Hourly aggregate summary across all active cubicles. */
export interface HeatmapHourlySummary {
  hour: string;
  hourLabel: string;
  totalPatients: number;
  avgSpeedMinutes: number;
  avgIdleMinutes: number;
  avgOccupancyPercent: number;
  activeCubiclesCount: number;
}

/** Facility-wide performance indicators for the selected operational day. */
export interface HeatmapDayKpis {
  selectedDate: string;
  totalPatientsServed: number;
  facilityAvgSpeedMinutes: number;
  facilityAvgIdleMinutes: number;
  facilityUtilizationPercent: number;
  peakHour: string | null;
  peakHourCount: number;
  mostActiveCubicle: string | null;
  mostActiveCount: number;
}

/** Pipeline stages in the outpatient examination workflow. */
export type PipelineStageKey =
  | 'waiting'
  | 'dispatch'
  | 'examination'
  | 'carryout'
  | 'completed';

/** Patient representation inside a flowchart stage card or inspection list. */
export interface FlowchartPatientItem {
  id: number;
  patientNum: string;
  service: string;
  status: string;
  cubicleNum?: string | null;
  enteredStageAt?: Date;
  elapsedMinutes?: number;
  consultStart?: Date;
  consultEnd?: Date;
  isStalled?: boolean;
}

/** Operational telemetry and patient details for an individual cubicle station. */
export interface FlowchartCubicleStation {
  id: number;
  cubicleNum: string;
  category: string;
  assignedDoctor?: string;
  status: CubicleStatus;
  currentPatient?: FlowchartPatientItem;
  elapsedMinutes?: number;
  estimatedRemainingMinutes?: number;
  speedRating?: SpeedRating;
  idleMinutes?: number;
  idleRating?: IdleRating;
  totalConsultationsToday: number;
  avgSpeedTodayMinutes: number;
}

/** Aggregate statistics and patient collection for a single pipeline stage. */
export interface FlowchartStageData {
  key: PipelineStageKey;
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  metricLabel: string;
  metricValue: string;
  avgDurationMinutes?: number;
  patients: FlowchartPatientItem[];
  alertCount?: number;
}

/** Overall facility summary KPIs for the flowchart header bar. */
export interface FlowchartPipelineKpis {
  totalInPipeline: number;
  waitingCount: number;
  dispatchCount: number;
  activeExamCount: number;
  carryoutCount: number;
  completedTodayCount: number;
  idleCubiclesCount: number;
  availableCubiclesCount: number;
  totalCubiclesCount: number;
  facilityUtilizationPercent: number;
  facilityAvgSpeedMinutes: number;
  facilityAvgIdleMinutes: number;
}


