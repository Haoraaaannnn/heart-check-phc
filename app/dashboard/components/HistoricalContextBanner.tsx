/**
 * @fileoverview Redesigned Historical Context & Monthly Breakdown component for Dashboard Overview.
 *
 * Implements an executive intelligence surface featuring:
 * 1. Longitudinal system status badge and clinical capacity health indicator.
 * 2. Four high-contrast solid KPI cards (Primary Bottleneck, Avg. Total Journey, Next-Day Forecast, Primary Service Mix).
 * 3. Year-filtered monthly performance breakdown table conforming to the Enterprise Solid Surfaces standard.
 * 4. Volume share distributions, annual total footers, and resilient fallback handling.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: pure assembly and rendering, strict separation of concerns,
 * high-contrast clinical ergonomics, and zero emojis.
 *
 * @module app/dashboard/components/HistoricalContextBanner
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import type { HistoricalSummaryPayload } from '@/app/dashboard/context/HistoricalSummaryContext';
import { useHistoricalSummary } from '@/app/dashboard/context/HistoricalSummaryContext';
import { HISTORICAL_TEXTS } from '@/app/dashboard/constants/historicalTexts';
import { HISTORICAL_STYLES } from '@/app/dashboard/constants/historicalStyles';
import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';
import { supabase } from '@/lib/supabase';

/**
 * Monthly performance record returned from backend analytics.
 */
export interface MonthEntry {
  /** Calendar month number (1 - 12) */
  month: number;
  /** Full calendar month name (e.g. "January") */
  month_label: string;
  /** Total patient intake recorded in the month */
  patient_count: number;
  /** Workflow stage with highest congestion */
  bottleneck_stage: string;
  /** Operational classification (Normal, Elevated, Overwhelmed) */
  system_status: 'Normal' | 'Elevated' | 'Overwhelmed' | 'No Data';
  /** Average total patient journey duration in minutes */
  avg_total_time_min: number;
}

/**
 * Properties for the {@link HistoricalContextBanner} component.
 */
export interface HistoricalContextBannerProps {
  /** Longitudinal historical data payload fetched from backend analytics */
  historicalData: HistoricalSummaryPayload | null;
  /** Whether the initial background analytics query is actively loading */
  historicalLoading: boolean;
  /** Whether the banner is shown because today has zero activity or requested on-demand */
  isTodayEmpty?: boolean;
  /** Optional callback fired when the user collapses the banner */
  onClose?: () => void;
}

/**
 * Formats a duration in minutes into a formal HH:MM:SS string.
 *
 * @param mins - Duration in minutes.
 * @returns Formatted duration string in HH:MM:SS format, or '--' if invalid.
 */
function formatDuration(mins: number): string {
  if (mins <= 0) return '--';
  return formatMinutesToHMS(mins);
}

/**
 * Executive historical data breakdown banner and monthly performance inspection table.
 *
 * @param props - Component properties.
 * @returns Rendered JSX element.
 */
export default function HistoricalContextBanner({
  historicalData,
  historicalLoading,
  isTodayEmpty = true,
  onClose,
}: HistoricalContextBannerProps) {
  const S = HISTORICAL_STYLES;
  const T = HISTORICAL_TEXTS;

  const { refreshHistorical } = useHistoricalSummary();

  const [years, setYears] = useState<number[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);

  // Client-side cache to avoid redundant network round-trips when switching years
  const monthCache = useRef<Record<number, MonthEntry[]>>({});

  /**
   * Helper retrieving active staff session bearer token for API route authentication.
   */
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // Fetch available archive years once on mount
  useEffect(() => {
    let isMounted = true;
    getAuthHeaders()
      .then((headers) => fetch('/api/available-years', { headers }))
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        const fetchedYears: number[] = json.years || [];
        const sorted = [...fetchedYears].sort((a, b) => b - a);
        setYears(sorted);
        setActiveYear(sorted[0] ?? new Date().getFullYear());
        setYearsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        const currentYear = new Date().getFullYear();
        setYears([currentYear]);
        setActiveYear(currentYear);
        setYearsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch or retrieve cached monthly records whenever activeYear changes
  useEffect(() => {
    if (activeYear === null) return;

    if (monthCache.current[activeYear]) {
      setMonths(monthCache.current[activeYear]);
      setMonthsError(null);
      return;
    }

    setMonthsLoading(true);
    setMonthsError(null);

    getAuthHeaders()
      .then((headers) => fetch(`/api/monthly-breakdown/${activeYear}`, { headers }))
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const fetchedMonths: MonthEntry[] = json.months || [];
        monthCache.current[activeYear] = fetchedMonths;
        setMonths(fetchedMonths);
        setMonthsLoading(false);
      })
      .catch((err) => {
        setMonthsError(err.message || 'Unable to retrieve monthly breakdown');
        setMonthsLoading(false);
      });
  }, [activeYear]);

  // Derive top clinical specialty from service distribution
  const topService = useMemo(() => {
    if (!historicalData?.service_distribution || historicalData.service_distribution.length === 0) {
      return null;
    }
    const sorted = [...historicalData.service_distribution].sort(
      (a, b) => b.total_patients - a.total_patients
    );
    const totalAll = sorted.reduce((sum, item) => sum + item.total_patients, 0);
    const top = sorted[0];
    const pct = totalAll > 0 ? Math.round((top.total_patients / totalAll) * 100) : 0;
    return { name: top.service, count: top.total_patients, pct };
  }, [historicalData]);

  // Calculate annual summary from monthly records
  const annualSummary = useMemo(() => {
    const totalPatients = months.reduce((acc, m) => acc + (m.patient_count || 0), 0);
    const validDurations = months
      .filter((m) => m.avg_total_time_min > 0)
      .map((m) => m.avg_total_time_min);
    const avgDuration =
      validDurations.length > 0
        ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
        : 0;

    return { totalPatients, avgDuration };
  }, [months]);

  // Loading skeleton state conforming to solid surfaces standard
  if (historicalLoading) {
    return (
      <div className={S.container}>
        <div className="flex items-center gap-3.5 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-surface-muted border border-line" />
          <div className="flex flex-col gap-2">
            <div className="w-48 h-5 rounded-md bg-surface-muted" />
            <div className="w-80 h-3.5 rounded-md bg-surface-muted" />
          </div>
        </div>
        <div className={S.cardsGrid}>
          <div className="h-28 rounded-xl bg-surface-muted border border-line animate-pulse" />
          <div className="h-28 rounded-xl bg-surface-muted border border-line animate-pulse" />
          <div className="h-28 rounded-xl bg-surface-muted border border-line animate-pulse" />
          <div className="h-28 rounded-xl bg-surface-muted border border-line animate-pulse" />
        </div>
      </div>
    );
  }

  // Resilient Error Recovery State: never return null and leave user with empty screen
  if (!historicalData) {
    return (
      <section className={S.container} aria-label={T.header.titleOnDemand}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-line bg-surface-muted">
          <div className="flex items-center gap-3">
            <i className="bx bx-error-circle text-2xl text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-bold text-content">Historical Baseline Calibrating</p>
              <p className="text-xs text-content-muted">
                Connecting to longitudinal database records...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refreshHistorical()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#a8071a] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#8e0616] cursor-pointer"
          >
            <i className="bx bx-refresh text-base" />
            <span>Re-fetch Baseline</span>
          </button>
        </div>
      </section>
    );
  }

  const rawStatus = (historicalData.bottleneck_analysis?.system_status || 'No Data') as
    | 'Normal'
    | 'Elevated'
    | 'Overwhelmed'
    | 'No Data';

  const status = S.statusBadge[rawStatus] ? rawStatus : 'No Data';
  const bottleneckStage =
    historicalData.bottleneck_analysis?.bottleneck_stage || T.cards.bottleneck.fallback;
  const avgTotalMins = historicalData.system_time?.avg_total_time ?? 0;
  const forecast = historicalData.computational_forecasting?.next_day_forecast ?? null;
  const bestAlgo = historicalData.computational_forecasting?.best_algorithm;

  const titleText = isTodayEmpty ? T.header.titleIdle : T.header.titleOnDemand;

  return (
    <section className={S.container} aria-label={titleText}>
      {/* Top Header Row */}
      <div className={S.header.root}>
        <div className={S.header.titleBlock}>
          <div className={S.header.iconBadge}>
            <i className="bx bx-history" />
          </div>
          <div className={S.header.textGroup}>
            <h2 className={S.header.title}>{titleText}</h2>
            <p className={S.header.subtitle}>{T.header.subtitle}</p>
          </div>
        </div>

        <div className={S.header.actions}>
          {/* Clinical Status Badge */}
          <span
            className={`${S.statusBadge.base} ${S.statusBadge[status]}`}
            title={T.statusDescriptions[status] ?? status}
          >
            <span
              className={`${S.statusBadge.dot} ${S.statusBadge[`${status}Dot` as keyof typeof S.statusBadge]}`}
            />
            <span>
              {T.header.badgeLabel} {status}
            </span>
          </span>

          {/* Optional collapse trigger button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={S.header.collapseBtn}
              aria-label={T.header.collapseButton}
            >
              <i className="bx bx-chevron-up text-base" />
              <span>{T.header.collapseButton}</span>
            </button>
          )}
        </div>
      </div>

      {/* Four Enriched Executive Stat Cards */}
      <div className={S.cardsGrid}>
        {/* Card 1: Primary Bottleneck */}
        <div className={`${S.card.tile} ${S.cardTones.amber.tile}`}>
          <div className={`${S.card.iconWrap} ${S.cardTones.amber.icon}`}>
            <i className="bx bx-traffic-cone" />
          </div>
          <div className={S.card.content}>
            <p className={S.card.label}>{T.cards.bottleneck.label}</p>
            <p className={S.card.value}>{bottleneckStage}</p>
            <p className={S.card.subtitle}>{T.cards.bottleneck.subtitle}</p>
          </div>
        </div>

        {/* Card 2: Avg. Total Patient Journey */}
        <div className={`${S.card.tile} ${S.cardTones.purple.tile}`}>
          <div className={`${S.card.iconWrap} ${S.cardTones.purple.icon}`}>
            <i className="bx bx-hourglass" />
          </div>
          <div className={S.card.content}>
            <div className="flex items-center justify-between">
              <p className={S.card.label}>{T.cards.journey.label}</p>
              <span className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300">
                PHC Target: &le; 150m
              </span>
            </div>
            <p className={S.card.value}>{formatDuration(avgTotalMins)}</p>
            <p className={S.card.subtitle}>{T.cards.journey.subtitle}</p>
          </div>
        </div>

        {/* Card 3: Next-Day Computational Projection */}
        <div className={`${S.card.tile} ${S.cardTones.emerald.tile}`}>
          <div className={`${S.card.iconWrap} ${S.cardTones.emerald.icon}`}>
            <i className="bx bx-line-chart" />
          </div>
          <div className={S.card.content}>
            <p className={S.card.label}>{T.cards.forecast.label}</p>
            <p className={S.card.value}>
              {forecast !== null
                ? `${forecast.toLocaleString()} ${T.cards.forecast.patientsUnit}`
                : T.cards.forecast.fallback}
            </p>
            {bestAlgo && (
              <span className={S.card.algoTag}>
                <i className="bx bx-check-shield text-emerald-600 dark:text-emerald-400" />
                <span>
                  {T.cards.forecast.modelPrefix} {bestAlgo}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Top Clinical Service Share */}
        <div className={`${S.card.tile} ${S.cardTones.blue.tile}`}>
          <div className={`${S.card.iconWrap} ${S.cardTones.blue.icon}`}>
            <i className="bx bx-pulse" />
          </div>
          <div className={S.card.content}>
            <p className={S.card.label}>{T.cards.serviceMix.label}</p>
            <p className={S.card.value}>
              {topService ? topService.name : T.cards.serviceMix.fallback}
            </p>
            <p className={S.card.subtitle}>
              {topService
                ? `${topService.count.toLocaleString()} patients (${topService.pct}% volume share)`
                : T.cards.serviceMix.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Section */}
      {!yearsLoading && years.length > 0 && (
        <div className={S.monthlySection.root}>
          <div className={S.monthlySection.header}>
            <div className={S.monthlySection.titleBlock}>
              <h3 className={S.monthlySection.title}>{T.monthlySection.title}</h3>
              <p className={S.monthlySection.subtitle}>
                {T.monthlySection.subtitle} &bull;{' '}
                <span className="font-semibold text-content">
                  {annualSummary.totalPatients.toLocaleString()} total in {activeYear}
                </span>
              </p>
            </div>

            {/* Year Selector Pills */}
            <div className={S.monthlySection.controls}>
              <span className="text-xs font-bold text-content-muted select-none">
                {T.monthlySection.yearSelectorLabel}
              </span>

              <div className={S.monthlySection.pillGroup}>
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setActiveYear(year)}
                    aria-pressed={activeYear === year}
                    className={`${S.monthlySection.yearPill} ${
                      activeYear === year
                        ? S.monthlySection.yearPillActive
                        : S.monthlySection.yearPillIdle
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className={S.table.wrap}>
            <table className={`${S.table.table} min-w-[700px]`}>
              <thead>
                <tr className={S.table.headRow}>
                  <th className={S.table.th}>{T.table.columns.month}</th>
                  <th className={S.table.th}>{T.table.columns.patients}</th>
                  <th className={S.table.th}>{T.table.columns.bottleneck}</th>
                  <th className={S.table.th}>{T.table.columns.journey}</th>
                  <th className={S.table.th}>{T.table.columns.status}</th>
                </tr>
              </thead>
              <tbody>
                {monthsLoading && (
                  <>
                    <tr className={S.table.skeletonRow}>
                      <td colSpan={5} className="p-4">
                        <div className={S.table.skeletonCell} />
                      </td>
                    </tr>
                    <tr className={S.table.skeletonRow}>
                      <td colSpan={5} className="p-4">
                        <div className={S.table.skeletonCell} />
                      </td>
                    </tr>
                    <tr className={S.table.skeletonRow}>
                      <td colSpan={5} className="p-4">
                        <div className={S.table.skeletonCell} />
                      </td>
                    </tr>
                  </>
                )}

                {!monthsLoading && monthsError && (
                  <tr>
                    <td colSpan={5} className={S.table.errorMessage}>
                      {T.monthlySection.errorPrefix} {monthsError}
                    </td>
                  </tr>
                )}

                {!monthsLoading && !monthsError && months.length === 0 && (
                  <tr>
                    <td colSpan={5} className={S.table.emptyMessage}>
                      {T.monthlySection.emptyMonths}
                    </td>
                  </tr>
                )}

                {!monthsLoading &&
                  !monthsError &&
                  months.map((m) => {
                    const rowStatus = S.statusBadge[m.system_status]
                      ? m.system_status
                      : 'No Data';

                    const monthSharePct =
                      annualSummary.totalPatients > 0
                        ? Math.round((m.patient_count / annualSummary.totalPatients) * 100)
                        : 0;

                    return (
                      <tr key={m.month} className={S.table.row}>
                        {/* Month */}
                        <td className={S.table.td}>
                          <span className={S.table.monthName}>
                            <i className={`bx bx-calendar ${S.table.monthIcon}`} />
                            <span>{m.month_label}</span>
                          </span>
                        </td>

                        {/* Patient Count & Volume Share */}
                        <td className={S.table.td}>
                          <div className="flex items-center gap-2">
                            <span className={S.table.patientBadge}>
                              {m.patient_count.toLocaleString()}
                            </span>
                            {m.patient_count > 0 && (
                              <span className="font-mono text-xs font-semibold text-content-muted tabular-nums">
                                ({monthSharePct}%)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Bottleneck Stage */}
                        <td className={S.table.td}>
                          <span className={S.table.stageBadge}>
                            <i className="bx bx-git-commit text-amber-500" />
                            <span>{m.bottleneck_stage}</span>
                          </span>
                        </td>

                        {/* Average Journey Time */}
                        <td className={S.table.td}>
                          <span className={S.table.journeyTime}>
                            <i className={`bx bx-time ${S.table.journeyIcon}`} />
                            <span>{formatDuration(m.avg_total_time_min)}</span>
                          </span>
                        </td>

                        {/* System Status */}
                        <td className={S.table.td}>
                          <span
                            className={`${S.statusBadge.base} ${S.statusBadge[rowStatus]}`}
                          >
                            <span
                              className={`${S.statusBadge.dot} ${
                                S.statusBadge[
                                  `${rowStatus}Dot` as keyof typeof S.statusBadge
                                ]
                              }`}
                            />
                            <span>{m.system_status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {/* Annual Summary Footer Row */}
              {!monthsLoading && !monthsError && months.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-line bg-surface-muted/90 font-bold">
                    <td className="px-4 py-3 text-xs uppercase tracking-wider text-content">
                      Annual Summary ({activeYear})
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-content tabular-nums">
                      {annualSummary.totalPatients.toLocaleString()} Total Patients
                    </td>
                    <td className="px-4 py-3 text-xs text-content-muted">
                      {bottleneckStage} (Dominant)
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-content tabular-nums">
                      {formatDuration(annualSummary.avgDuration)} Mean Duration
                    </td>
                    <td className="px-4 py-3 text-xs text-content-muted">
                      {status}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Clinical Telemetry Notice */}
      <div className={S.footer.root}>
        <i className={`bx bx-info-circle ${S.footer.icon}`} />
        <span>{T.footer.notice}</span>
      </div>
    </section>
  );
}
