/**
 * @fileoverview Configuration constants, standard options, and metadata dictionaries
 * for the Admin Dashboard Export Data module.
 *
 * Defines service options, date selection modes, rolling timeframes, calendar month configurations,
 * sheet column specifications, and hospital compliance threshold metadata.
 *
 * @remarks
 * Conforms strictly to AGENTS.md rules: comprehensive documentation, professional clinical
 * naming, and zero emojis.
 *
 * @module app/dashboard/pages/export/constants/export
 */

import { ExportDateMode, ExportFileFormat, ExportOptions } from '../types/exportTypes';

/** API base route for backend analytics requests. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** Network request timeout in milliseconds for export generation (30 seconds). */
export const EXPORT_FETCH_TIMEOUT_MS = 30000;

/** Default date selection mode. */
export const DEFAULT_DATE_MODE: ExportDateMode = 'specific';

/** Default file format. */
export const DEFAULT_FILE_FORMAT: ExportFileFormat = 'xlsx';

/** Default range selection identifier. */
export const DEFAULT_RANGE = 'all';

/**
 * Standard clinical hospital departments supported for export filtering.
 */
export const EXPORT_SERVICE_OPTIONS = [
  { value: 'all', label: 'All Clinical Services (OPD Master)' },
  { value: 'Consultation', label: 'Consultation' },
  { value: 'OPD Screening', label: 'OPD Screening' },
  { value: 'ECG', label: 'ECG' },
  { value: 'Warfarin', label: 'Warfarin' },
  { value: 'OPD Card', label: 'OPD Card' },
  { value: 'Refill Prescription', label: 'Refill Prescription' },
  { value: 'OPD Reschedule', label: 'OPD Reschedule' },
  { value: 'Benzathine', label: 'Benzathine' },
] as const;

/**
 * Supported date selection modes with metadata for interactive tabs.
 */
export const EXPORT_DATE_MODES = [
  {
    id: 'specific' as ExportDateMode,
    label: 'Single Clinic Day',
    shortLabel: 'Single Day',
    icon: 'bx-calendar-event',
    description: 'Export an authoritative single-day worksheet for a specific recorded date.',
  },
  {
    id: 'month' as ExportDateMode,
    label: 'Calendar Month',
    shortLabel: 'Month / Year',
    icon: 'bx-calendar',
    description: 'Export a multi-sheet workbook containing all clinic days recorded in a month.',
  },
  {
    id: 'range' as ExportDateMode,
    label: 'Rolling Range & History',
    shortLabel: 'Range / All',
    icon: 'bx-time-five',
    description: 'Export a rolling time period (90d, 180d, 365d) or all recorded historical dates.',
  },
] as const;

/**
 * Rolling date range preset options.
 */
export const RANGE_OPTIONS = [
  { value: '90d', label: 'Last 90 Days', description: 'Recent 3-month operational window' },
  { value: '180d', label: 'Last 180 Days', description: 'Semi-annual audit timeframe' },
  { value: '365d', label: 'Last 365 Days (1 Year)', description: 'Full calendar year volume' },
  { value: 'all', label: 'All Recorded Dates', description: 'Complete database archive' },
] as const;

/**
 * 12 calendar month representations for the interactive month picker.
 */
export const MONTHS_CONFIG = [
  { value: 1, name: 'January', shortName: 'Jan' },
  { value: 2, name: 'February', shortName: 'Feb' },
  { value: 3, name: 'March', shortName: 'Mar' },
  { value: 4, name: 'April', shortName: 'Apr' },
  { value: 5, name: 'May', shortName: 'May' },
  { value: 6, name: 'June', shortName: 'Jun' },
  { value: 7, name: 'July', shortName: 'Jul' },
  { value: 8, name: 'August', shortName: 'Aug' },
  { value: 9, name: 'September', shortName: 'Sep' },
  { value: 10, name: 'October', shortName: 'Oct' },
  { value: 11, name: 'November', shortName: 'Nov' },
  { value: 12, name: 'December', shortName: 'Dec' },
] as const;

/**
 * Specifications for the 10 data columns (A-J) in the PHC Time and Motion Analysis workbook.
 */
export const EXPORT_COLUMNS_INFO = [
  {
    col: 'A',
    header1: 'Queuing',
    header2: 'Time',
    field: 'reg_start',
    description: 'Timestamp when patient ticket was logged at registration or kiosk.',
  },
  {
    col: 'B',
    header1: 'Initial',
    header2: 'Assessment',
    field: 'reg_end',
    description: 'Timestamp when patient triage / vital signs assessment concluded.',
  },
  {
    col: 'C',
    header1: 'Doctor',
    header2: 'Seen',
    field: 'consult_start',
    description: 'Timestamp when consultation in the examination room commenced.',
  },
  {
    col: 'D',
    header1: 'Doctor',
    header2: 'Completed',
    field: 'consult_end',
    description: 'Timestamp when clinical consultation was finalized by physician.',
  },
  {
    col: 'E',
    header1: 'Carry Out',
    header2: 'Completed',
    field: 'carryout_end',
    description: 'Timestamp when pharmacy orders, lab requisitions, or scheduling completed.',
  },
  {
    col: 'F',
    header1: 'Queuing Time to',
    header2: 'Initial Assessment',
    field: 'duration_queue_to_eval',
    description: 'Waiting duration: Initial Assessment (B) minus Queuing Time (A).',
  },
  {
    col: 'G',
    header1: 'Initial Assessment',
    header2: 'to Doctor Seen',
    field: 'duration_eval_to_consult',
    description: 'Waiting duration: Doctor Seen (C) minus Initial Assessment (B).',
  },
  {
    col: 'H',
    header1: 'Doctor Seen',
    header2: 'to Completed',
    field: 'duration_consult',
    description: 'Treatment duration: Doctor Completed (D) minus Doctor Seen (C).',
  },
  {
    col: 'I',
    header1: 'Doctor Completed to',
    header2: 'Carry Out Completed',
    field: 'duration_carryout',
    description: 'Post-consult duration: Carry Out (E) minus Doctor Completed (D).',
  },
  {
    col: 'J',
    header1: 'Total',
    header2: 'Waiting Time',
    field: 'duration_total',
    description: 'Full cycle time: Final completion milestone minus Queuing Time (A).',
  },
] as const;

/**
 * Metadata definitions for the 4-row bottom compliance summary calculation block.
 */
export const COMPLIANCE_FORMULAS_INFO = [
  {
    row: 1,
    indicator: 'Total Waiting Time Target',
    target: '<= 2.5 hours (180 mins)',
    formula: 'COUNTIF(Col J, "<= 03:00:00")',
    secondary: 'Average Patient Waiting Time',
  },
  {
    row: 2,
    indicator: 'Evaluate Patients Target',
    target: '<= 30 minutes',
    formula: 'COUNTIF(Col F, "<= 00:30:00")',
    secondary: 'Number of Patients Seen',
  },
  {
    row: 3,
    indicator: 'Examine & Treat Patients Target',
    target: '<= 1.45 hours (105 mins)',
    formula: 'COUNTIF(Col G, "<= 01:45:00")',
    secondary: 'Number of Doctors on Duty (Default: 1)',
  },
  {
    row: 4,
    indicator: 'Carry Out Doctor Orders Target',
    target: '<= 15 minutes',
    formula: 'COUNTIF(Col I, "<= 00:15:00")',
    secondary: 'Patient to Doctor Ratio Per Hour',
  },
] as const;

/** Initial export options baseline. */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  mode: 'specific',
  selectedDate: '',
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  selectedRange: 'all',
  selectedService: 'all',
  format: 'xlsx',
  includeSummaryBlock: true,
};
