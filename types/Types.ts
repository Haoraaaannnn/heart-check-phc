/**
 * Summary metrics of patient traffic for the current day.
 */
export interface PatientStats {
  /** Total registered patient count for today. */
  totalToday: number;
  /** Number of patients currently awaiting consultation. */
  inQueue: number;
  /** Number of patients currently undergoing consultation. */
  inService: number;
  /** Number of patients completed and served today. */
  servedToday: number;
  /** Average wait duration in minutes across all served or queued patients. */
  avgWaitTime: number;
}

/**
 * Represents a patient record within recent queue summaries and feeds.
 */
export interface RecentPatient {
  /** Unique database identifier of the patient record. */
  id: string;
  /** Queue ticket number displayed to patients. */
  patientNum: string;
  /** Medical service or department assigned. */
  service: string;
  /** Current queue progress status. */
  status: string;
  /** Full registration timestamp formatted for display. */
  createdAt: string;
  /** Short time string formatted for tabular display (e.g. HH:MM AM/PM). */
  time?: string;
  /** Elapsed or calculated wait duration in minutes, or formatted string. */
  waitTime?: number | string;
}

/**
 * Extended patient record including date representations for multi-day logs.
 */
export interface AllRecentPatient extends RecentPatient {
  /** Native Date object of patient registration. */
  createdAtDate?: Date;
  /** Short time string formatted for tabular display. */
  time?: string;
  /** Elapsed or calculated wait duration formatted string or number. */
  waitTime?: string | number;
}


export interface AnalyticsData {
  daily_summary?: Array<{
    visit_date: string;
    total_patients: number;
    avg_wait_registration: number;
    avg_wait_consultation: number;
    avg_total_time: number;
  }>;
  hourly_pattern?: Array<{
    hour: number;
    avg_patients: number;
    avg_wait_consultation: number;
    time_label: string;
  }>;
  bottleneck_analysis?: {
    bottleneck_stage: string;
    avg_wait_registration_min: number;
    avg_wait_consultation_min: number;
    system_status: string;
  };
}
export type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string | null;
  service?: string;
  created_at?: string;
  updated_at?: string;
  phoneNum?: number;
  reg_start?: string;
  reg_end?: string;
  consult_start?: string;
  consult_end?: string;
  counter?: number;
  called_at?: string;
  timeout_seconds?: number;
  queue_position?: number;
  progress_started_at?: string | null;
  cubicle_top_started_at?: string | null;
  preferredCubicleNums?: string[] | null;
  subcategory?: string | null;
  carryout_start?: string | null;
  carryout_end?: string | null;
  cooldown_until?: string | null;
  rotation_count?: number;
  counter_rejoin_at?: string | null;
  counter_top_started_at?: string | null;
  idle_at?: string | null;
  removed_at?: string | null;
};

export type Cubicle = {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string | null;
  doctorId?: string | null;
};

export type Doctor = {
  id: string;
  full_name: string;
  specialty?: string | null;
  email?: string | null;
  auth_id?: string | null;
  active: boolean;
  created_at?: string;
};
export type CubicleSelectorType = {
  id: number;
  cubicle_name: string;
  cubicle_order: number;
  cubicle_id: number | null;
  cubicle?: { cubicleNum: string } | null; 
};