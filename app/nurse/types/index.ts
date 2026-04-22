export type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
  service?: string;
  created_at?: string;
  updated_at?: string;
  phoneNum?: number;
  queue_start?: string;
  with_doctor_since?: string;
  finished_time?: string;
};