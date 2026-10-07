/**
 * @fileoverview Custom React hook managing dataset availability querying,
 * export parameter selection, binary workbook download streaming, and session history.
 *
 * Implements resilient network communication with the FastAPI backend, strict
 * AbortController timeout protection (Rule 12), and telemetry aggregation.
 *
 * @remarks
 * Decouples state logic entirely from presentation components. Zero emojis in error strings.
 *
 * @module app/dashboard/pages/export/hooks/useFileExport
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  API_BASE_URL,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_FETCH_TIMEOUT_MS,
  MONTHS_CONFIG,
} from '../constants/export';
import { EXPORT_TEXTS } from '../constants/exportTexts';
import {
  AvailableExportDatesResponse,
  ExportHistoryItem,
  ExportOptions,
  ExportTelemetrySummary,
} from '../types/exportTypes';

/**
 * Return signature of the {@link useFileExport} hook.
 */
export interface UseFileExportReturn {
  /** Ingestion options and selected filtering parameters. */
  options: ExportOptions;
  /** Dispatcher to update export options. */
  setOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
  /** Available dates dataset response from the server. */
  availableDates: AvailableExportDatesResponse;
  /** Whether available export dates are currently loading. */
  isLoadingDates: boolean;
  /** Whether an export workbook is currently building/downloading. */
  isExporting: boolean;
  /** Error diagnostic message if operation failed. */
  error: string | null;
  /** Clears the current error message. */
  clearError: () => void;
  /** Array of downloads generated during this browser session. */
  history: ExportHistoryItem[];
  /** Latest successful export telemetry result for banner rendering. */
  lastExportResult: {
    filename: string;
    periodLabel: string;
    format: string;
    timestamp: string;
  } | null;
  /** Dismisses the completion results banner. */
  dismissResultBanner: () => void;
  /** Search text filter for clinic days. */
  dateSearchQuery: string;
  /** Sets search query for clinic days. */
  setDateSearchQuery: (query: string) => void;
  /** Computed list of calendar days filtered by search text and year. */
  filteredDays: string[];
  /** Aggregated telemetry numbers summarizing the available database records. */
  telemetry: ExportTelemetrySummary;
  /** Refreshes available dates from the backend cache. */
  refreshDates: () => Promise<void>;
  /** Generates and downloads the export file. */
  triggerExport: () => Promise<void>;
  /** Re-downloads a previously generated file from session cache. */
  reDownloadHistoryItem: (id: string) => void;
  /** Clears session download history. */
  clearHistory: () => void;
  /** Evaluates whether the current configuration is valid to execute. */
  canExport: boolean;
  /** User-friendly label representing the target period scope. */
  targetPeriodLabel: string;
  /** Predicted output filename. */
  predictedFilename: string;
}

/**
 * Custom hook providing reactive state and operations for exporting patient queue datasets.
 *
 * @returns Comprehensive state and operational dispatchers.
 */
export function useFileExport(): UseFileExportReturn {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [availableDates, setAvailableDates] = useState<AvailableExportDatesResponse>({
    years: [],
    dates: {},
    days: [],
  });
  const [isLoadingDates, setIsLoadingDates] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [lastExportResult, setLastExportResult] = useState<UseFileExportReturn['lastExportResult']>(null);
  const [dateSearchQuery, setDateSearchQuery] = useState<string>('');

  const T = EXPORT_TEXTS;

  /**
   * Fetches the distinct years, months, and days containing usable patient queue data.
   */
  const fetchAvailableDates = useCallback(async (refresh: boolean = false) => {
    setIsLoadingDates(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = `${API_BASE_URL}/api/available-export-dates${refresh ? '?refresh=true' : ''}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(T.errors.failedToFetchDates);
      }

      const data: AvailableExportDatesResponse = await res.json();
      const years = Array.isArray(data.years) ? data.years : [];
      const dates = data.dates || {};
      const days = Array.isArray(data.days) ? data.days : [];

      setAvailableDates({ years, dates, days });

      // Synchronize default options if needed
      setOptions((prev) => {
        const next = { ...prev };
        if (days.length > 0 && !next.selectedDate) {
          next.selectedDate = days[0];
        }
        if (years.length > 0 && !years.includes(next.selectedYear)) {
          next.selectedYear = years[0];
          const monthsForYear = dates[String(years[0])] || [];
          if (monthsForYear.length > 0) {
            next.selectedMonth = monthsForYear[0];
          }
        }
        return next;
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError(T.errors.networkTimeout);
      } else {
        setError(err instanceof Error ? err.message : T.errors.failedToFetchDates);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingDates(false);
    }
  }, [T.errors.failedToFetchDates, T.errors.networkTimeout]);

  // Initial fetch on mount
  useEffect(() => {
    fetchAvailableDates(false);
  }, [fetchAvailableDates]);

  /**
   * Refreshes dates from the server with cache invalidation.
   */
  const refreshDates = useCallback(async () => {
    await fetchAvailableDates(true);
  }, [fetchAvailableDates]);

  /**
   * Computes dataset telemetry.
   */
  const telemetry = useMemo<ExportTelemetrySummary>(() => {
    const days = availableDates.days || [];
    const years = availableDates.years || [];
    let totalMonths = 0;
    Object.values(availableDates.dates || {}).forEach((monthArr) => {
      totalMonths += monthArr.length;
    });

    return {
      totalDaysWithData: days.length,
      yearsWithData: years,
      earliestDate: days.length > 0 ? days[days.length - 1] : null,
      latestDate: days.length > 0 ? days[0] : null,
      totalMonthsWithData: totalMonths,
    };
  }, [availableDates]);

  /**
   * Filters recorded clinic days for display in the interactive date browser.
   */
  const filteredDays = useMemo(() => {
    const days = availableDates.days || [];
    const yearStr = String(options.selectedYear);

    return days.filter((d) => {
      const matchesYear = d.startsWith(yearStr);
      if (!matchesYear) return false;

      if (!dateSearchQuery.trim()) return true;
      return d.toLowerCase().includes(dateSearchQuery.trim().toLowerCase());
    });
  }, [availableDates.days, options.selectedYear, dateSearchQuery]);

  /**
   * Human-readable target period label.
   */
  const targetPeriodLabel = useMemo(() => {
    if (options.mode === 'specific') {
      if (!options.selectedDate) return 'No Date Selected';
      const parts = options.selectedDate.split('-');
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const y = parseInt(parts[0], 10);
        const monthName = MONTHS_CONFIG[m - 1]?.name || parts[1];
        return `${monthName} ${String(d).padStart(2, '0')}, ${y} (Single Day Sheet)`;
      }
      return options.selectedDate;
    }

    if (options.mode === 'month') {
      const monthObj = MONTHS_CONFIG.find((m) => m.value === options.selectedMonth);
      const mName = monthObj?.name || `Month ${options.selectedMonth}`;
      return `${mName} ${options.selectedYear} (Full Month Multi-Sheet)`;
    }

    if (options.mode === 'range') {
      if (options.selectedRange === 'all') return 'All Recorded History (Master Archive)';
      if (options.selectedRange === '90d') return 'Last 90 Days Rolling Window';
      if (options.selectedRange === '180d') return 'Last 180 Days Rolling Window';
      if (options.selectedRange === '365d') return 'Last 365 Days Rolling Window';
      return options.selectedRange;
    }

    return 'All Recorded Dates';
  }, [options.mode, options.selectedDate, options.selectedMonth, options.selectedYear, options.selectedRange]);

  /**
   * Predicted output filename based on current parameter selections.
   */
  const predictedFilename = useMemo(() => {
    const ext = options.format === 'csv' ? 'csv' : 'xlsx';
    if (options.mode === 'specific') {
      return `phc_time_motion_export_${options.selectedDate || 'day'}.${ext}`;
    }
    if (options.mode === 'month') {
      const mStr = String(options.selectedMonth).padStart(2, '0');
      return `phc_time_motion_export_${options.selectedYear}_${mStr}.${ext}`;
    }
    if (options.mode === 'range') {
      if (options.selectedRange === 'all') return `phc_time_motion_export_all_dates.${ext}`;
      return `phc_time_motion_export_${options.selectedRange}.${ext}`;
    }
    return `phc_time_motion_export.${ext}`;
  }, [options.mode, options.format, options.selectedDate, options.selectedMonth, options.selectedYear, options.selectedRange]);

  /**
   * Evaluates if configuration is ready for export.
   */
  const canExport = useMemo(() => {
    if (isExporting || isLoadingDates) return false;
    if (options.mode === 'specific') {
      return Boolean(options.selectedDate && options.selectedDate.length === 10);
    }
    if (options.mode === 'month') {
      const monthsForYear = availableDates.dates[String(options.selectedYear)] || [];
      return monthsForYear.includes(options.selectedMonth);
    }
    if (options.mode === 'range') {
      return Boolean(options.selectedRange);
    }
    return true;
  }, [isExporting, isLoadingDates, options.mode, options.selectedDate, options.selectedYear, options.selectedMonth, options.selectedRange, availableDates.dates]);

  /**
   * Executes the export request against the FastAPI backend.
   */
  const triggerExport = useCallback(async () => {
    if (!canExport) return;

    setIsExporting(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXPORT_FETCH_TIMEOUT_MS);

    try {
      const params = new URLSearchParams();

      if (options.mode === 'specific') {
        params.set('date', options.selectedDate);
      } else if (options.mode === 'month') {
        const mStr = String(options.selectedMonth).padStart(2, '0');
        params.set('month', `${options.selectedYear}-${mStr}`);
      } else if (options.mode === 'range') {
        params.set('range', options.selectedRange);
      }

      if (options.selectedService && options.selectedService !== 'all') {
        params.set('service', options.selectedService);
      }

      if (options.format === 'csv') {
        params.set('format', 'csv');
      }

      const res = await fetch(`${API_BASE_URL}/api/export-excel?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        let msg = T.errors.failedToGenerateExport;
        try {
          const json = await res.json();
          if (json && json.detail) msg = json.detail;
        } catch {
          // ignore non-json
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadFilename = predictedFilename;

      // Trigger automatic browser download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      const historyItem: ExportHistoryItem = {
        id: `export-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        filename: downloadFilename,
        periodLabel: targetPeriodLabel,
        serviceLabel: options.selectedService === 'all' ? 'All Clinical Services' : options.selectedService,
        format: options.format,
        timestamp: new Date().toISOString(),
        status: 'success',
        fileSizeBytes: blob.size,
        downloadUrl,
      };

      setHistory((prev) => [historyItem, ...prev]);
      setLastExportResult({
        filename: downloadFilename,
        periodLabel: targetPeriodLabel,
        format: options.format.toUpperCase(),
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError(T.errors.networkTimeout);
      } else {
        setError(err instanceof Error ? err.message : T.errors.failedToGenerateExport);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsExporting(false);
    }
  }, [
    canExport,
    options.mode,
    options.selectedDate,
    options.selectedMonth,
    options.selectedYear,
    options.selectedRange,
    options.selectedService,
    options.format,
    predictedFilename,
    targetPeriodLabel,
    T.errors.failedToGenerateExport,
    T.errors.networkTimeout,
  ]);

  /**
   * Re-downloads an export from cached session history.
   */
  const reDownloadHistoryItem = useCallback((id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item || !item.downloadUrl) return;

    const a = document.createElement('a');
    a.href = item.downloadUrl;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [history]);

  /**
   * Clears session download history and frees object URLs.
   */
  const clearHistory = useCallback(() => {
    history.forEach((item) => {
      if (item.downloadUrl) {
        window.URL.revokeObjectURL(item.downloadUrl);
      }
    });
    setHistory([]);
  }, [history]);

  const clearError = useCallback(() => setError(null), []);
  const dismissResultBanner = useCallback(() => setLastExportResult(null), []);

  return {
    options,
    setOptions,
    availableDates,
    isLoadingDates,
    isExporting,
    error,
    clearError,
    history,
    lastExportResult,
    dismissResultBanner,
    dateSearchQuery,
    setDateSearchQuery,
    filteredDays,
    telemetry,
    refreshDates,
    triggerExport,
    reDownloadHistoryItem,
    clearHistory,
    canExport,
    targetPeriodLabel,
    predictedFilename,
  };
}
