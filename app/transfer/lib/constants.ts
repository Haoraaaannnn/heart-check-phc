export const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening'
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Consultation': 'bx-chat',
  'OPD Card': 'bx-id-card',
  'Refill Prescription': 'bx-capsule',
  'ECG': 'bx-heart',
  'Warfarin': 'bxs-capsule',
  'OPD Reschedule': 'bx-calendar',
  'Benzathine': 'bx-injection',
  'OPD Screening': 'bx-search-alt-2'
};

export const CONSULTATION_SUBCATEGORIES = ['Pedia', 'Adult'];

export const AUTO_ASSIGN_SERVICES = [
  'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening'
];

export const MAX_PATIENTS_PER_CUBICLE = 5;