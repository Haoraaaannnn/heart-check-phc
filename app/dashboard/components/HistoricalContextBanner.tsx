/**
 * @fileoverview Redesigned Historical Context & Monthly Breakdown component for Dashboard Overview.
 *
 * Implements an executive intelligence surface featuring:
 * 1. Longitudinal system status badge and clinical capacity health indicator.
 * 2. Three high-contrast solid KPI cards (Primary Bottleneck, Avg. Total Journey, Next-Day Forecast).
 * 3. Year-filtered monthly performance breakdown table conforming to the Enterprise Solid Surfaces standard.
 * 4. Longitudinal clinical notice and session-scoped year caching.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: pure assembly and rendering, strict separation of concerns,
 * high-contrast clinical ergonomics, and zero emojis.
 *
 * @module app/dashboard/components/HistoricalContextBanner
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { HISTORICAL_TEXTS } from '@/app/dashboard/constants/historicalTexts';
import { HISTORICAL_STYLES } from '@/app/dashboard/constants/historicalStyles';

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
  historicalData: any;
  /** Whether the initial background analytics query is actively loading */
  historicalLoading: boolean;
  /** Whether the banner is shown because today has zero activity or requested on-demand */
  isTodayEmpty?: boolean;
  /** Optional callback fired when the user collapses the banner */
  onClose?: () => void;
}

/**
 * Formats a duration in minutes into a human-readable "Xh Ym" or "Ym" string.
 *
 * @param mins - Duration in minutes.
 * @returns Formatted duration string.
 */
function formatDuration(mins: number): string {
  if (mins <= 0) return '--';
  const hrs = Math.floor(mins / 60);
  const remMins = Math.round(mins % 60);
  if (hrs === 0) return `${remMins}m`;
  return `${hrs}h ${remMins}m`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  const [years, setYears] = useState<number[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);

  // Client-side cache to avoid redundant network round-trips when switching years
  const monthCache = useRef<Record<number, MonthEntry[]>>({});

  // Fetch available archive years once on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/available-years`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const fetchedYears: number[] = json.years || [];
        const sorted = [...fetchedYears].sort((a, b) => b - a);
        setYears(sorted);
        setActiveYear(sorted[0] ?? null);
        setYearsLoading(false);
      })
      .catch(() => {
        setYears([]);
        setYearsLoading(false);
      });
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

    fetch(`${API_BASE}/api/monthly-breakdown/${activeYear}`)
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
        setMonthsError(err.message);
        setMonthsLoading(false);
      });
  }, [activeYear]);

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
        </div>
      </div>
    );
  }

  if (!historicalData) return null;

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

      {/* Three Executive Stat Cards */}
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
            <p className={S.card.label}>{T.cards.journey.label}</p>
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
      </div>

      {/* Monthly Breakdown Section */}
      {!yearsLoading && years.length > 0 && (
        <div className={S.monthlySection.root}>
          <div className={S.monthlySection.header}>
            <div className={S.monthlySection.titleBlock}>
              <h3 className={S.monthlySection.title}>{T.monthlySection.title}</h3>
              <p className={S.monthlySection.subtitle}>{T.monthlySection.subtitle}</p>
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
            <table className={S.table.table}>
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

                    return (
                      <tr key={m.month} className={S.table.row}>
                        {/* Month */}
                        <td className={S.table.td}>
                          <span className={S.table.monthName}>
                            <i className={`bx bx-calendar ${S.table.monthIcon}`} />
                            <span>{m.month_label}</span>
                          </span>
                        </td>

                        {/* Patient Count */}
                        <td className={S.table.td}>
                          <span className={S.table.patientBadge}>
                            {m.patient_count.toLocaleString()}
                          </span>
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