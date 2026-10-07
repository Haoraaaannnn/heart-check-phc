/**
 * @fileoverview Type definitions and data contracts for the Admin Dashboard Export Data module.
 *
 * Defines contracts for date selection modes, file formats, backend export telemetry,
 * user options, and session download history items.
 *
 * @remarks
 * Strictly conforms to AGENTS.md guidelines: complete symbol documentation, no emojis,
 * and high-contrast solid surface architectural models.
 *
 * @module app/dashboard/pages/export/types/exportTypes
 */

/**
 * Supported date filtering modes for patient queue data export.
 */
export type ExportDateMode = 'specific' | 'month' | 'range' | 'all';

/**
 * Supported output file serialization formats.
 */
export type ExportFileFormat = 'xlsx' | 'csv';

/**
 * Structure returned by the FastAPI /api/available-export-dates endpoint.
 */
export interface AvailableExportDatesResponse {
  /** Array of calendar years with recorded patient queue records. */
  years: number[];
  /** Mapping of calendar year string to array of month numbers (1-12). */
  dates: Record<string, number[]>;
  /** Array of distinct dates formatted as YYYY-MM-DD in descending order. */
  days: string[];
}

/**
 * User-configurable parameters for generating an export workbook or dataset.
 */
export interface ExportOptions {
  /** Selected date filtering mode. */
  mode: ExportDateMode;
  /** ISO date string (YYYY-MM-DD) for specific day export. */
  selectedDate: string;
  /** Calendar year for month-based export. */
  selectedYear: number;
  /** Month index (1-12) for month-based export. */
  selectedMonth: number;
  /** Rolling timeframe identifier e.g. '90d', '180d', '365d', 'all'. */
  selectedRange: string;
  /** Selected clinical department or 'all' for complete OPD. */
  selectedService: string;
  /** Target file format (openpyxl workbook or comma-separated values). */
  format: ExportFileFormat;
  /** Whether the bottom 4-row compliance summary formula block is enabled. */
  includeSummaryBlock: boolean;
}

/**
 * Representation of a completed or attempted file export in the current session.
 */
export interface ExportHistoryItem {
  /** Unique client identifier for reconciliation. */
  id: string;
  /** Downloaded filename including extension. */
  filename: string;
  /** Human-readable representation of the target timeframe. */
  periodLabel: string;
  /** User-friendly label of the filtered clinic service. */
  serviceLabel: string;
  /** File format serialized. */
  format: ExportFileFormat;
  /** ISO timestamp string when the export was triggered. */
  timestamp: string;
  /** Execution status of the generation request. */
  status: 'success' | 'failed';
  /** Optional byte size of the downloaded blob. */
  fileSizeBytes?: number;
  /** Optional object URL pointing to the cached file blob for re-download. */
  downloadUrl?: string;
  /** Error message if export failed. */
  errorMessage?: string;
}

/**
 * Aggregated dataset telemetry summarizing available patient records for export.
 */
export interface ExportTelemetrySummary {
  /** Total count of distinct recorded calendar days containing queue milestones. */
  totalDaysWithData: number;
  /** Array of calendar years containing patient data. */
  yearsWithData: number[];
  /** Earliest recorded date string (YYYY-MM-DD) found in the database. */
  earliestDate: string | null;
  /** Latest recorded date string (YYYY-MM-DD) found in the database. */
  latestDate: string | null;
  /** Total count of distinct active year-month pairs. */
  totalMonthsWithData: number;
}
