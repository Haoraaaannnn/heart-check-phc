/**
 * @fileoverview Modal component for selecting date (month and year) and exporting
 * queue data into PHC Time and Motion Analysis Excel workbooks.
 *
 * Renders into document.body via React Portal to ensure the modal displays
 * on top of all application components, headers, and sidebars regardless
 * of ancestor stacking contexts.
 *
 * @module app/dashboard/pages/analytics/components/ExportExcelModal
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ANALYTICS_STYLES,
  ANALYTICS_ICONS,
} from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

/**
 * Response structure returned by the available-export-dates endpoint.
 */
interface AvailableExportDatesResponse {
  /** Array of calendar years containing patient export data. */
  years?: number[];
  /** Mapping of year string to array of month numbers (1-12) containing data. */
  dates?: Record<string, number[]>;
}

/**
 * Properties for the ExportExcelModal component.
 */
interface ExportExcelModalProps {
  /** Whether the export modal is currently visible. */
  isOpen: boolean;
  /** Callback fired when closing the modal. */
  onClose: () => void;
  /** Optional pre-selected clinical service. */
  defaultService?: string;
}

/**
 * Modal dialog for selecting an available calendar month and exporting queue metrics
 * formatted to PHC Time and Motion Analysis standards.
 *
 * Only years and months containing recorded patient data are presented to the user,
 * preventing empty export generation requests.
 *
 * @param props - Component properties.
 * @returns JSX element portaled to document.body or null when closed.
 */
export default function ExportExcelModal({
  isOpen,
  onClose,
  defaultService,
}: ExportExcelModalProps) {
  const S = ANALYTICS_STYLES.exportModal;
  const T = ANALYTICS_TEXTS.exportModal;
  const I = ANALYTICS_ICONS;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableDates, setAvailableDates] = useState<Record<string, number[]>>({});
  const [isLoadingDates, setIsLoadingDates] = useState<boolean>(true);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedService, setSelectedService] = useState<string>(defaultService || 'all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Client-side mount flag for React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch available dates when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setIsLoadingDates(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${baseUrl}/api/available-export-dates`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load available export dates');
        return res.json() as Promise<AvailableExportDatesResponse>;
      })
      .then((data) => {
        if (isCancelled) return;
        const fetchedYears = Array.isArray(data.years) ? data.years : [];
        const fetchedDates = data.dates || {};

        setAvailableYears(fetchedYears);
        setAvailableDates(fetchedDates);
        setIsLoadingDates(false);

        if (fetchedYears.length > 0) {
          const defaultYear = fetchedYears.includes(currentYear)
            ? currentYear
            : fetchedYears[0];
          setSelectedYear(defaultYear);

          const monthsForYear = fetchedDates[String(defaultYear)] || [];
          if (monthsForYear.length > 0) {
            const defaultMonth = monthsForYear.includes(currentMonth)
              ? currentMonth
              : monthsForYear[monthsForYear.length - 1];
            setSelectedMonth(defaultMonth);
          }
        }
      })
      .catch(() => {
        if (isCancelled) return;
        setIsLoadingDates(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentYear, currentMonth]);

  // Handle escape key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    },
    [isExporting, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted || typeof document === 'undefined' || !document.body) {
    return null;
  }

  // Derive year options and previous/next navigation from available years
  const yearOptions = availableYears.length > 0 ? availableYears : [selectedYear];

  const earlierYears = availableYears.filter((y) => y < selectedYear);
  const prevYear = earlierYears.length > 0 ? Math.max(...earlierYears) : null;

  const laterYears = availableYears.filter((y) => y > selectedYear);
  const nextYear = laterYears.length > 0 ? Math.min(...laterYears) : null;

  const handleSelectYear = (newYear: number) => {
    setSelectedYear(newYear);
    const monthsForYear = availableDates[String(newYear)] || [];
    if (monthsForYear.length > 0 && !monthsForYear.includes(selectedMonth)) {
      setSelectedMonth(monthsForYear[monthsForYear.length - 1]);
    }
  };

  const handlePrevYear = () => {
    if (prevYear !== null) {
      handleSelectYear(prevYear);
    }
  };

  const handleNextYear = () => {
    if (nextYear !== null) {
      handleSelectYear(nextYear);
    }
  };

  // Only display months that have data available
  const monthsForYear = availableDates[String(selectedYear)] || [];
  const visibleMonths = T.months.filter((m) => monthsForYear.includes(m.value));

  const selectedMonthObj =
    T.months.find((m) => m.value === selectedMonth) ||
    visibleMonths[0] ||
    T.months[0];

  const canExport =
    !isExporting &&
    !isLoadingDates &&
    visibleMonths.length > 0 &&
    monthsForYear.includes(selectedMonth);

  const handleExport = async () => {
    if (!canExport) return;

    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const monthParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const params = new URLSearchParams({ month: monthParam });

      if (selectedService && selectedService !== 'all') {
        params.set('service', selectedService);
      }

      const res = await fetch(`${baseUrl}/api/export-excel?${params.toString()}`);

      if (!res.ok) {
        let errorMsg = T.defaultError;
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) {
            errorMsg = errJson.detail;
          }
        } catch {
          // Non-JSON response
        }
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phc_time_motion_export_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : T.defaultError);
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <div
      className={S.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className={S.modalBox}>
        {/* Header */}
        <div className={S.header}>
          <div className={S.titleWrap}>
            <h2 id="export-modal-title" className={S.title}>
              <i className={`bx ${I.calendar} ${S.titleIcon}`} aria-hidden="true" />
              <span>{T.title}</span>
            </h2>
            <p className={S.subtitle}>{T.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className={S.closeBtn}
            aria-label={T.closeAria}
          >
            <i className={`bx ${I.close} ${S.closeIcon}`} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className={S.body}>
          {/* Year Selection */}
          <div className={S.section}>
            <label htmlFor="export-year-select" className={S.sectionLabel}>
              <i className={`bx ${I.calendar}`} aria-hidden="true" />
              <span>{T.yearLabel}</span>
            </label>
            <div className={S.yearRow}>
              <button
                type="button"
                onClick={handlePrevYear}
                disabled={isExporting || isLoadingDates || prevYear === null}
                className={S.yearButton}
                aria-label={T.prevYearAria}
              >
                <i className={`bx ${I.chevronLeft} text-lg`} aria-hidden="true" />
              </button>
              <select
                id="export-year-select"
                value={selectedYear}
                onChange={(e) => handleSelectYear(Number(e.target.value))}
                disabled={isExporting || isLoadingDates}
                className={S.yearSelect}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleNextYear}
                disabled={isExporting || isLoadingDates || nextYear === null}
                className={S.yearButton}
                aria-label={T.nextYearAria}
              >
                <i className={`bx ${I.chevronRight} text-lg`} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Month Selection */}
          <div className={S.section}>
            <span className={S.sectionLabel}>
              <i className={`bx ${I.calendar}`} aria-hidden="true" />
              <span>{T.monthLabel}</span>
            </span>

            {isLoadingDates ? (
              <div className={S.loadingDates}>
                <i className={`bx ${I.spinner} ${S.spinner}`} aria-hidden="true" />
                <span>{T.loadingDates}</span>
              </div>
            ) : visibleMonths.length === 0 ? (
              <div className={S.emptyState}>
                <span>{T.noMonthsForYear}</span>
              </div>
            ) : (
              <div className={S.monthGrid}>
                {visibleMonths.map((m) => {
                  const isActive = selectedMonth === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setSelectedMonth(m.value)}
                      disabled={isExporting}
                      className={`${S.monthBtn} ${isActive ? S.monthBtnActive : S.monthBtnIdle}`}
                    >
                      <span>{m.short}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clinical Service Selection */}
          <div className={S.section}>
            <label htmlFor="export-service-select" className={S.sectionLabel}>
              <i className={`bx ${I.file}`} aria-hidden="true" />
              <span>{T.serviceLabel}</span>
            </label>
            <select
              id="export-service-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              disabled={isExporting}
              className={S.serviceSelect}
            >
              {T.services.map((svc) => (
                <option key={svc.value} value={svc.value}>
                  {svc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specification Preview Card */}
          <div className={S.infoCard}>
            <div className={S.infoRow}>
              <span className={S.infoLabel}>{T.targetPeriodLabel}</span>
              <span className={S.infoValue}>
                {selectedMonthObj.name} {selectedYear}
              </span>
            </div>
            <div className={S.infoRow}>
              <span className={S.infoLabel}>{T.formatLabel}</span>
              <span className={S.infoValue}>{T.formatValue}</span>
            </div>
            <div className={S.infoRow}>
              <span className={S.infoLabel}>{T.structureLabel}</span>
              <span className={S.infoValue}>{T.structureValue}</span>
            </div>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className={S.errorBanner} role="alert">
              <i className={`bx ${I.errorCircle} text-base shrink-0`} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className={S.successBanner} role="status">
              <i className={`bx ${I.check} text-base shrink-0`} aria-hidden="true" />
              <span>{T.downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className={S.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className={S.cancelBtn}
          >
            {T.cancelButton}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className={S.confirmBtn}
          >
            {isExporting ? (
              <>
                <i className={`bx ${I.spinner} ${S.spinner}`} aria-hidden="true" />
                <span>{T.confirmLoading}</span>
              </>
            ) : (
              <>
                <i className={`bx ${I.download} text-base`} aria-hidden="true" />
                <span>{T.confirmButton}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
