/** @fileoverview Encrypted kiosk ticket creation with validated responses and safe patient-facing failures. */
import { supabase } from '@/lib/supabase';
import { encryptPatientPhoneAction } from '@/app/actions/phoneSecurity';

/** Safe creation failure displayed on the kiosk instead of logging database diagnostics. */
export class KioskTicketError extends Error {
  /** @param storageUnavailable - Whether encrypted contact storage needs configuration. */
  constructor(storageUnavailable = false) {
    super(storageUnavailable
      ? 'Secure phone storage is unavailable. Please skip SMS or contact staff to finish check-in.'
      : 'Unable to create your queue ticket. Please try again or contact staff.');
    this.name = 'KioskTicketError';
  }
}

/** Inputs for a single encrypted ticket insert. */
interface CreateKioskPatientOptions {
  service: string;
  subcategory: string | null;
  preferredCubicles: string[] | null;
  prefix: string;
  groupBySubcategory: boolean;
  phone: string | null;
}

/**
 * Encrypts before insertion and never retries with a plaintext phone number.
 * @param options - Patient-selected service and optional mobile contact.
 * @returns A validated ticket number after one acknowledged insert.
 */
export async function createKioskPatient(options: CreateKioskPatientOptions): Promise<string> {
  let encryptedPhone: string | null = null;
  if (options.phone) {
    try { encryptedPhone = await encryptPatientPhoneAction(options.phone); }
    catch { throw new KioskTicketError(true); }
    if (!/^enc:v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]{22,26}$/.test(encryptedPhone)) throw new KioskTicketError(true);
  }
  const { data, error } = await supabase.rpc('create_patient', {
    p_service: options.service, p_subcategory: options.subcategory,
    p_preferred_cubicles: options.preferredCubicles, p_prefix: options.prefix,
    p_group_by_subcategory: options.groupBySubcategory, p_phone: encryptedPhone,
  });
  if (error) throw new KioskTicketError(encryptedPhone !== null &&
    (error.code === '22P02' || error.code === '42804' || error.message?.includes('bigint')));
  const rows: unknown = data;
  if (!Array.isArray(rows) || rows.length === 0) throw new KioskTicketError();
  const row: unknown = rows[0];
  if (typeof row !== 'object' || row === null || !('patientNum' in row) ||
      typeof row.patientNum !== 'string' || !row.patientNum.trim()) throw new KioskTicketError();
  return row.patientNum;
}
