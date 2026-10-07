/**
 * @fileoverview Type definitions and data contracts for the Admin Dashboard Import Data module.
 *
 * Defines models for staged file lifecycle, inspection schemas, API responses,
 * and user-selected ingestion options.
 *
 * @module app/dashboard/pages/import/types/importTypes
 */

/** Possible execution stages for a staged file. */
export type FileStageStatus =
  | 'pending'
  | 'inspecting'
  | 'readyToCommit'
  | 'importing'
  | 'completed'
  | 'error';

/** Date range structure returned from backend inspection. */
export interface DateRangeMeta {
  start: string | null;
  end: string | null;
}

/** Single row contract extracted from preview records. */
export interface PreviewPatientRow {
  patientNum?: string;
  created_at?: string;
  service?: string;
  status?: string;
  reg_start?: string;
  reg_end?: string;
  consult_start?: string;
  consult_end?: string;
  carryout_start?: string;
  carryout_end?: string;
  cubicleNum?: string;
  phoneNum?: string;
  is_historical?: boolean;
}

/** Response structure returned by backend for dry-run inspection or commit. */
export interface ImportApiResponse {
  success: boolean;
  mode: 'inspect' | 'commit';
  filename: string;
  format: 'phc_excel' | 'standard_csv' | 'standard_excel';
  sheets_processed: string[];
  total_extracted: number;
  valid_records: number;
  dropped_records: number;
  date_range: DateRangeMeta;
  preview_rows: PreviewPatientRow[];
  inserted_records: number;
  errors: string[];
}

/** Representation of an individual file staged in the import queue. */
export interface StagedFile {
  /** Unique client identifier. */
  id: string;
  /** Native File reference. */
  file: File;
  /** Clean original filename. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** File extension (e.g. '.xls'). */
  extension: string;
  /** Current ingestion processing status. */
  status: FileStageStatus;
  /** Cached inspection result for previewing. */
  previewData?: ImportApiResponse;
  /** Ingestion commit result upon database insert. */
  commitResult?: ImportApiResponse;
  /** Error message string if processing failed. */
  errorMessage?: string;
}

/** Configurable ingestion options. */
export interface ImportOptions {
  /** Target clinic service department. */
  service: string;
  /** Whether to mark inserted records as immutable historical baseline. */
  isHistorical: boolean;
  /** Batch chunk size per database insert. */
  batchSize: number;
}
