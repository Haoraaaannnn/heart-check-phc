/**
 * @fileoverview UI text strings and user-facing copy for the Admin Dashboard Import Data module.
 *
 * All labels, descriptions, instructions, button copy, modal texts, table column titles,
 * and error messages for the file import feature are defined here.
 * Components must import and consume text from this file.
 *
 * @remarks
 * Adheres strictly to AGENTS.md rules: separation of concerns, professional healthcare
 * terminology, and zero emojis.
 *
 * @module app/dashboard/pages/import/constants/importTexts
 */

export const IMPORT_TEXTS = {
  header: {
    title: 'Import Patient Data',
    subtitle: 'Upload and ingest PHC Time and Motion workbooks (.xls, .xlsx) or patient queue records (.csv) directly into the database.',
    breadcrumb: 'Operations / Import Data',
    backToDashboard: 'Back to Overview',
  },
  dropzone: {
    idleTitle: 'Drag and drop your files here',
    idleSubtitle: 'or click to browse from your computer',
    activeTitle: 'Drop files to upload',
    activeSubtitle: 'Release files to stage them for inspection and database ingestion',
    supportedFormatsLabel: 'Supported file types: Excel 97-2004 (.xls), Modern Excel (.xlsx), and Patient Data (.csv)',
    maxSizeLabel: 'Maximum file size: up to 50 MB per file',
    browseButton: 'Browse Files',
  },
  options: {
    title: 'Import Ingestion Options',
    subtitle: 'Configure target department and research archive settings before committing records.',
    serviceLabel: 'Target Clinic / Service:',
    servicePlaceholder: 'Select clinic department',
    historicalToggleLabel: 'Mark Records as Historical Research Baseline',
    historicalToggleDesc: 'Designates imported rows as immutable historical baseline (is_historical = true). Preserves research datasets and prevents operational accidental modification.',
    batchSizeLabel: 'Batch Chunk Size:',
    batchSizeHelp: 'Number of rows sent per Supabase insert transaction (default: 500)',
  },
  stagedFiles: {
    title: 'Staged Files',
    subtitle: 'Review queued files before inspecting or committing records to Supabase.',
    emptyNotice: 'No files currently staged. Drag and drop files above to begin.',
    tableHeaders: {
      name: 'File Name',
      size: 'File Size',
      format: 'Detected Type',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      pending: 'Ready to Process',
      inspecting: 'Inspecting Schema...',
      readyToCommit: 'Inspected (Ready)',
      importing: 'Ingesting to DB...',
      completed: 'Successfully Imported',
      error: 'Ingestion Failed',
    },
    actions: {
      remove: 'Remove File',
      inspect: 'Inspect / Preview',
      importSingle: 'Import File',
      importAll: 'Import All Files',
      clearAll: 'Clear All',
    },
  },
  previewModal: {
    title: 'File Data Inspection & Preview',
    subtitle: 'Verify extracted sheet structure, milestone timestamps, and row counts before saving to the database.',
    summaryCards: {
      totalRows: 'Total Rows Detected',
      validRows: 'Valid Queue Records',
      droppedRows: 'Dropped Rows (Missing Milestones)',
      sheetsProcessed: 'Sheets Inspected',
      dateRange: 'Recorded Date Range',
    },
    previewTableTitle: 'Sample Extracted Records (First 10 Rows)',
    tableColumns: {
      patientNum: 'Ticket / Patient ID',
      service: 'Service',
      queuingTime: 'Queuing (reg_start)',
      initialAssessment: 'Assessment (reg_end)',
      doctorSeen: 'Doctor Seen (consult_start)',
      doctorCompleted: 'Doctor Done (consult_end)',
      carryOut: 'Carry Out (carryout_end)',
      status: 'Status',
    },
    confirmButton: 'Confirm & Ingest to Database',
    cancelButton: 'Close Preview',
  },
  results: {
    successTitle: 'Data Ingestion Completed',
    successSubtitle: 'Records were successfully written to the Supabase patients table.',
    partialTitle: 'Data Ingestion Finished with Warnings',
    failedTitle: 'Data Ingestion Failed',
    metrics: {
      inserted: 'Records Ingested',
      dropped: 'Rows Skipped',
      sheets: 'Sheets Processed',
      dateSpan: 'Date Span',
    },
    viewPatientsButton: 'View Patient Records',
    viewAnalyticsButton: 'View Forecasting & Analytics',
    importMoreButton: 'Import More Files',
  },
  formatGuide: {
    title: 'Supported File Formats & Schema Guidelines',
    subtitle: 'Review source file specifications to ensure accurate ingestion without row rejections.',
    phcTitle: 'PHC Time and Motion Analysis Excel Workbooks (.xls / .xlsx)',
    phcDesc: 'Official Philippine Heart Center daily time study logs with individual day sheets. The importer automatically locates Date: headers, Hospital number columns, and converts afternoon clinic hours (1:00 PM - 7:00 PM) to 24-hour UTC timestamps.',
    phcColumns: 'Required milestones per patient row: Queuing Time, Initial Assessment, Doctor Seen, Doctor Completed.',
    csvTitle: 'Standard Patient Queue Datasets (.csv / .xlsx)',
    csvDesc: 'Tabular queue records containing column headers such as patientNum, service, status, created_at, reg_start, reg_end, consult_start, consult_end.',
    csvColumns: 'Recognized columns: patientNum, service, status, created_at, reg_start, reg_end, consult_start, consult_end, carryout_start, carryout_end, cubicleNum.',
  },
  errors: {
    unsupportedExtension: 'Unsupported file extension. Only .xls, .xlsx, and .csv files are supported.',
    fileTooLarge: 'File exceeds maximum allowed size of 50 MB.',
    emptyFile: 'The uploaded file is empty.',
    networkError: 'Unable to connect to the backend server. Please verify that the API service is online.',
    serverErrorPrefix: 'Ingestion error: ',
    genericError: 'An unexpected error occurred while parsing the file. Please review the file format and try again.',
  },
} as const;
