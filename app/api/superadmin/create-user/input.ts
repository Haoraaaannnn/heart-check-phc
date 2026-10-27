/** @fileoverview Runtime guards for account creation assignment payloads. */

/** @param value - External input. @returns Whether named fields can be inspected safely. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param value - External array. @returns Whether all entries are positive identifiers. */
function isIds(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'number' && Number.isSafeInteger(item) && item > 0);
}

/** @param value - External array. @returns Whether all entries are bounded names. */
function isNames(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string' && item.trim().length > 0 && item.length <= 100);
}

/** Validated registration room assignment. */
interface Room { service: string; subcategory: string | null; room: number }

/** @param value - External array. @returns Whether all room assignments are valid. */
function isRooms(value: unknown): value is Room[] {
  if (!Array.isArray(value)) return false;
  return value.every((item: unknown) => isRecord(item) && typeof item.service === 'string' && item.service.trim().length > 0 &&
    (item.subcategory === null || typeof item.subcategory === 'string') &&
    typeof item.room === 'number' && Number.isSafeInteger(item.room) && item.room > 0);
}

/**
 * Validates assignments before account insertion, retaining optional defaults.
 * @param body - Untrusted account request.
 * @returns Whether all assignment fields satisfy the creation contract.
 */
export function hasValidAssignments(body: Record<string, unknown>): body is Record<string, unknown> & {
  cubicleIds?: number[]; serviceAssignments?: string[]; roomAssignments?: Room[];
  counterAssignments?: number[]; workstationAccess?: string[];
} {
  return (body.cubicleIds === undefined || isIds(body.cubicleIds)) &&
    (body.counterAssignments === undefined || isIds(body.counterAssignments)) &&
    (body.serviceAssignments === undefined || isNames(body.serviceAssignments)) &&
    (body.roomAssignments === undefined || isRooms(body.roomAssignments)) &&
    (body.workstationAccess === undefined || (isNames(body.workstationAccess) &&
      body.workstationAccess.every((id) => ['transfer', 'nurse', 'dashboard', 'superadmin'].includes(id))));
}
