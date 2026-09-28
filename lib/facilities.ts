export const SERVICES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine', 'OPD Screening',
];
export const SERVICES_WITH_SUBCATEGORIES = ['Consultation', 'OPD Screening'];
export const SUBCATEGORIES = ['Adult', 'Pedia'];
export const DEFAULT_COUNTERS = [1, 2, 3, 4, 5];

export function buildCubicleNum(
  category: string,
  subcategory: string | null,
  room: number,
  index: number
): string {
  const parts = [category];
  if (subcategory) parts.push(subcategory);
  parts.push(`R${room}`, `C${index}`);
  return parts.join(' ');
}