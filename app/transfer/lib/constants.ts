import { CATEGORY_ICONS } from '@/constants/icons';

export const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening'
];

export { CATEGORY_ICONS };

export const ROTATE_TIMEOUT_MS = 2 * 60 * 1000;
export const MAX_ROTATIONS_BEFORE_IDLE = 5;

export const CONSULTATION_SUBCATEGORIES = ['Pedia', 'Adult'];

export const AUTO_ASSIGN_SERVICES = [
  'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine'
];

export const MAX_PATIENTS_PER_CUBICLE = 5;