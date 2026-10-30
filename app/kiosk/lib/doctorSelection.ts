/** @fileoverview Shared kiosk routing and doctor labels without exposing station identifiers. */
import type { ActualCubicle, CubicleSelectorType } from '@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType';

/** @returns Runtime-validated service flags used by both server guards and category navigation. */
export function parseDoctorSelectionService(value: unknown): { label_en: string; requires_cubicle: boolean } | null {
  if (typeof value !== 'object' || value === null || !('label_en' in value) || typeof value.label_en !== 'string'
    || !('requires_cubicle' in value) || (value.requires_cubicle !== null && typeof value.requires_cubicle !== 'boolean')) return null;
  return { label_en: value.label_en, requires_cubicle: value.requires_cubicle === true };
}

/** @returns Whether this service asks the patient to choose a physician. */
export function requiresDoctorSelection(service: { label_en?: string | null; requires_cubicle?: boolean | null } | null | undefined): boolean {
  const label = service?.label_en?.trim().toLowerCase().replace(/\s+/g, ' ');
  return service?.requires_cubicle === true && label !== 'opd screening' && label !== 'opd screenings';
}

/** @returns Valid matching stations behind a physician option; their IDs remain internal routing data. */
export function matchingDoctorCubicles(options: { selector: CubicleSelectorType; subcategory?: string }): ActualCubicle[] {
  return (options.selector.cubicles ?? []).map(link => link.cubicle).filter((station): station is ActualCubicle =>
    station !== null && station.category === 'Consultation' && (!options.subcategory || station.subcategory === options.subcategory));
}

/** @returns Physician names only, with each title applied once and no cubicle fallback label. */
export function doctorSelectionLabel(options: { selector: CubicleSelectorType; subcategory?: string }): string | null {
  const names = matchingDoctorCubicles(options).map(station => station.doctorName?.trim()).filter((name): name is string => Boolean(name));
  if (!names.length && options.selector.doctorName?.trim()) names.push(options.selector.doctorName.trim());
  return names.length ? [...new Set(names)].map(name => /^dr\.?\s+/i.test(name) ? name : `Dr. ${name}`).join(', ') : null;
}
