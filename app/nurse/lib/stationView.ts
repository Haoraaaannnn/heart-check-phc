/** @fileoverview Deterministic station-scoped patient views and validated physician/location metadata. */
import type { Patient } from '@/types/Types';
import type { AssignedNurseCubicle } from '@/app/nurse/types/nurse';

/** Display metadata never changes the caller's server-verified clinical permissions. */
export interface NurseStationContext { doctorName: string | null; room: number; readOnly: boolean }

/** @param service - Clinical service label. @returns Whether the service permits the shared OPD Screening view. */
export function isOpdScreeningService(service: unknown): boolean {
  return typeof service === 'string' && service.trim().toLowerCase() === 'opd screening';
}

/** @param value - External station collection. @returns Runtime-checked station and physician metadata. */
export function parseNurseStations(value: unknown): AssignedNurseCubicle[] {
  if (!Array.isArray(value)) throw new Error('Station details could not be verified.');
  return value.map((row: unknown) => {
    if (typeof row !== 'object' || row === null || !('id' in row) || typeof row.id !== 'number' ||
        !Number.isSafeInteger(row.id) || !('cubicleNum' in row) || typeof row.cubicleNum !== 'string' ||
        !('category' in row) || typeof row.category !== 'string' || !('room' in row) || typeof row.room !== 'number' ||
        !Number.isSafeInteger(row.room)) throw new Error('Station details could not be verified.');
    const doctorName: unknown = 'doctorName' in row ? row.doctorName : null;
    const doctorId: unknown = 'doctorId' in row ? row.doctorId : null;
    const subcategory: unknown = 'subcategory' in row ? row.subcategory : null;
    if (!(doctorName === null || typeof doctorName === 'string') || !(doctorId === null || typeof doctorId === 'string') ||
        !(subcategory === null || typeof subcategory === 'string')) throw new Error('Doctor details could not be verified.');
    return { id: row.id, cubicleNum: row.cubicleNum, category: row.category, room: row.room, doctorName, doctorId, subcategory };
  });
}

/**
 * Applies ownership before optional service and station filters, including when stale global data is still cached.
 * @param options - Patient data, owned stations, explicit shared OPD Screening choice, and current filters.
 * @returns Only patients belonging to the selected display scope.
 */
export function filterNurseStationPatients(options: {
  patients: Patient[]; ownedStations: AssignedNurseCubicle[]; showAllScreening: boolean;
  selectedCategory: string | null; selectedCubicleNum: string | null;
}): Patient[] {
  const owned = new Set(options.ownedStations.map(station => station.cubicleNum));
  const screeningAllowed = options.ownedStations.some(station => isOpdScreeningService(station.category));
  return options.patients.filter(patient => Boolean(patient.cubicleNum) &&
    (options.showAllScreening ? screeningAllowed && isOpdScreeningService(patient.service) : owned.has(patient.cubicleNum ?? '')) &&
    (!options.selectedCategory || patient.service?.trim().toLowerCase() === options.selectedCategory.trim().toLowerCase()) &&
    (!options.selectedCubicleNum || patient.cubicleNum?.trim().toLowerCase() === options.selectedCubicleNum.trim().toLowerCase()));
}

/** @param options - Display stations and owned stations. @returns Per-ticket doctor, room, and read-only metadata. */
export function nurseStationContexts(options: {
  stations: AssignedNurseCubicle[]; ownedStations: AssignedNurseCubicle[];
}): Record<string, NurseStationContext> {
  const owned = new Set(options.ownedStations.map(station => station.cubicleNum));
  return Object.fromEntries(options.stations.map(station => [station.cubicleNum,
    { doctorName: station.doctorName ?? null, room: station.room, readOnly: !owned.has(station.cubicleNum) }]));
}
