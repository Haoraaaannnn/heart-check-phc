/**
 * @fileoverview Configuration tokens and constants for the Admin Dashboard Import Data module.
 *
 * Defines accepted file extensions, maximum payload size thresholds, default ingestion options,
 * and standard clinical service department options.
 *
 * @module app/dashboard/pages/import/constants/import
 */

/** Supported file extension whitelist for drag-and-drop validation. */
export const ACCEPTED_FILE_EXTENSIONS = ['.xls', '.xlsx', '.csv'] as const;

/** Accept string passed to native file input elements. */
export const ACCEPT_FILE_INPUT = '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

/** Maximum permitted individual file size in bytes (50 MB). */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Default number of records per Supabase insert transaction. */
export const DEFAULT_BATCH_SIZE = 500;

/** Default clinical service department applied to imported rows. */
export const DEFAULT_SERVICE = 'Consultation';

/** Default state for the is_historical database flag. */
export const DEFAULT_IS_HISTORICAL = true;

/**
 * Standard clinical hospital services available for assignment during import.
 */
export const IMPORT_SERVICE_OPTIONS = [
  'Consultation',
  'OPD Screening',
  'ECG',
  'Warfarin',
  'OPD Card',
  'Refill Prescription',
  'OPD Reschedule',
  'Benzathine',
] as const;

/** Supported batch size preset choices. */
export const BATCH_SIZE_OPTIONS = [100, 250, 500, 1000] as const;
