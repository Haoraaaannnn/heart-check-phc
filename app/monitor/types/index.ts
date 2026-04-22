export type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
  service?: string;
  phoneNum?: number;
  started_at?: string;
  with_doctor_since?: string;
  created_at?: string;
  updated_at?: string;
};

export type Cubicle = {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string;
};