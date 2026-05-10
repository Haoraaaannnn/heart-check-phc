export interface PatientStats {
  totalToday: number;
  inQueue: number;
  servedToday: number;
  avgWaitTime: number;
}

export interface RecentPatient {
  id: string;
  patientNum: string;
  service: string;
  status: string;
  createdAt: string;
  waitTime?: number;
}

export interface AllRecentPatient extends RecentPatient {
  createdAtDate: Date;
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