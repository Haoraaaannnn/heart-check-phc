/** @fileoverview Runtime validation for shared physician directory responses. */
import type { Cubicle, Doctor } from '@/types/Types';

/** @param value - External input. @returns Whether it is a named-field record. */
export function isDoctorRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param value - External physician row. @returns Validated physician or null. */
function parseDoctor(value: unknown): Doctor | null {
  if (!isDoctorRecord(value) || typeof value.id !== 'string' || typeof value.full_name !== 'string' ||
      typeof value.active !== 'boolean' || !(value.specialty == null || typeof value.specialty === 'string') ||
      !(value.auth_id == null || typeof value.auth_id === 'string')) return null;
  return { id: value.id, full_name: value.full_name, active: value.active,
    specialty: value.specialty ?? null, auth_id: value.auth_id ?? null };
}

/** @param value - External station row. @returns Validated station or null. */
function parseCubicle(value: unknown): Cubicle | null {
  if (!isDoctorRecord(value) || typeof value.id !== 'number' || !Number.isSafeInteger(value.id) ||
      typeof value.cubicleNum !== 'string' || typeof value.category !== 'string' ||
      typeof value.room !== 'number' || !Number.isSafeInteger(value.room) ||
      !(value.subcategory == null || typeof value.subcategory === 'string') ||
      !(value.doctorId == null || typeof value.doctorId === 'string')) return null;
  return { id: value.id, cubicleNum: value.cubicleNum, category: value.category, room: value.room,
    subcategory: value.subcategory ?? null, doctorId: value.doctorId ?? null };
}

/** @param value - API response. @returns Validated directory and server-owned editing capabilities. */
export function parseDoctorDirectory(value: unknown): {
  doctors: Doctor[]; cubicles: Cubicle[]; canManageDirectory: boolean; editableCubicleIds: number[]; editableDoctorIds: string[];
} {
  if (!isDoctorRecord(value) || !Array.isArray(value.doctors) || !Array.isArray(value.cubicles) ||
      typeof value.canManageDirectory !== 'boolean' || !Array.isArray(value.editableCubicleIds) ||
      !value.editableCubicleIds.every(id => typeof id === 'number' && Number.isSafeInteger(id)) ||
      !Array.isArray(value.editableDoctorIds) || !value.editableDoctorIds.every(id => typeof id === 'string')) {
    throw new Error('The doctor directory returned an invalid response.');
  }
  const doctors = value.doctors.map(parseDoctor); const cubicles = value.cubicles.map(parseCubicle);
  if (doctors.some(row => row === null) || cubicles.some(row => row === null)) throw new Error('Doctor or cubicle details could not be verified.');
  return { doctors: doctors.filter((row): row is Doctor => row !== null), cubicles: cubicles.filter((row): row is Cubicle => row !== null),
    canManageDirectory: value.canManageDirectory, editableCubicleIds: value.editableCubicleIds, editableDoctorIds: value.editableDoctorIds };
}
