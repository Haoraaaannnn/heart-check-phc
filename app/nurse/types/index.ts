export type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
  service?: string;
  phoneNum?: number;
  reg_start?: string;
  reg_end?: string;
  consult_start?: string;
  consult_end?: string;
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