/**
 * @fileoverview Legacy constants re-export for the Nurse Dashboard.
 *
 * Preserves backwards compatibility for category names, category icons,
 * and re-exports new architectural constants from app/nurse/constants.
 */

import { CATEGORY_ICONS } from '@/constants/icons';

export * from '../constants/nurse';
export * from '../constants/nurseTexts';

export const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening'
] as const;

export { CATEGORY_ICONS };