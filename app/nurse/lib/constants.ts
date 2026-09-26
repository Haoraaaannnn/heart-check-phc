/**
 * @fileoverview Legacy constants re-export for the Nurse Dashboard.
 *
 * Preserves backwards compatibility for category names, category icons,
 * and re-exports new architectural constants from app/nurse/constants.
 */

export * from '../constants';

export const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening'
] as const;

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