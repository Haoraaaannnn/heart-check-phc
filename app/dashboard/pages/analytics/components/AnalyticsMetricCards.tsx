/**
 * @fileoverview Summary metric cards row for the Analytics dashboard page.
 *
 * Visualizes overall system status (Normal, Elevated, Overwhelmed), average total patient
 * duration through the facility, next-day algorithmic volume forecasts, and recommended staff,
 * with plain-English explanations of what each card computes.
 *
 * @module app/dashboard/pages/analytics/components/AnalyticsMetricCards
 */

'use client';

import { TONES } from '@/app/dashboard/constants/styles';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import AnalyticsExplainer from '@/app/dashboard/pages/analytics/components/AnalyticsExplainer';
import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';

interface ClinicStaffRecommendation {
  recommended_doctors?: number;
  capacity_sufficient?: boolean;
  expected_utilization?: number;
  warning?: string | null;
}

export interface AnalyticsSummaryPayload {
  bottleneck_analysis?: {
    system_status?: string;
    bottleneck_stage?: string;
    primary_bottleneck?: {
      stage_label?: string;
      reason?: string;
    } | null;
  };
  system_time?: {
    avg_total_time?: number;
    within_target?: boolean;
    excess_min?: number;
  };
  computational_forecasting?: {
    next_day_forecast?: number;
    best_algorithm?: string;
  };
  lr_chart_data?: {
    forecast_date?: string;
  };
  decision_support?: {
    recommended_doctors?: number;
    adult_clinic?: ClinicStaffRecommendation;
    pedia_clinic?: ClinicStaffRecommendation;
  };
}

interface AnalyticsMetricCardsProps {
  /** Raw analytics payload from the FastAPI backend. */
  data: AnalyticsSummaryPayload;
}

/**
 * 4-column metric row presenting high-level analytical KPI summaries
 * along with plain-English computation notes.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function AnalyticsMetricCards({ data }: AnalyticsMetricCardsProps) {
  const S = ANALYTICS_STYLES.metricCard;
  const T = ANALYTICS_TEXTS.metrics;
  const SC = ANALYTICS_STYLES.systemStatusCard;

  const bottleneck = data.bottleneck_analysis;
  const status: 'Normal' | 'Elevated' | 'Overwhelmed' =
    bottleneck?.system_status === 'Overwhelmed'
      ? 'Overwhelmed'
      : bottleneck?.system_status === 'Elevated'
      ? 'Elevated'
      : 'Normal';

  const primary = bottleneck?.primary_bottleneck;

  const totalMins = data.system_time?.avg_total_time ?? 0;
  const formattedPatientTime = totalMins > 0 ? formatMinutesToHMS(totalMins) : '--:--:--';
  const withinTarget = data.system_time?.within_target ?? totalMins <= 150;
  const excessMin = data.system_time?.excess_min ?? Math.max(0, totalMins - 150);

  const forecastValue = data.computational_forecasting?.next_day_forecast ?? 0;
  const forecastDate = data.lr_chart_data?.forecast_date || T.nextDayForecast.defaultDate;
  const forecastAlgo = data.computational_forecasting?.best_algorithm ?? 'N/A';

  const recommendedDoctors = data.decision_support?.recommended_doctors ?? 1;
  const adultDocs = data.decision_support?.adult_clinic?.recommended_doctors;
  const pediaDocs = data.decision_support?.pedia_clinic?.recommended_doctors;
  const staffWarning =
    data.decision_support?.adult_clinic?.warning ||
    data.decision_support?.pedia_clinic?.warning ||
    null;

  return (
    <div className="flex flex-col gap-3">
      <div className={ANALYTICS_STYLES.metricsGrid}>
        {/* 1. System Status Card */}
        <div className={`${SC.base} ${SC[status]}`}>
          <div>
            <span className={SC.eyebrow}>{T.systemStatus.label}</span>
            <p className={SC.value}>{ANALYTICS_TEXTS.bottleneckTable.levels[status] ?? status}</p>
          </div>
          <div>
            <p className={SC.bottleneck}>
              {T.systemStatus.bottleneckPrefix}{' '}
              {primary?.stage_label || bottleneck?.bottleneck_stage || T.systemStatus.noneLabel}
            </p>
            {primary?.reason && <p className={SC.reason}>{primary.reason}</p>}
            <div className="mt-2 pt-2 border-t border-line/40 text-[11px] text-content leading-snug">
              <span className="font-bold uppercase tracking-wider text-[10px] text-content-subtle block">
                Operational Direction:
              </span>
              <span>{T.systemStatus.directions[status]}</span>
            </div>
            <p className="mt-2 pt-2 border-t border-line/30 text-[11px] text-content-muted leading-snug">
              {T.systemStatus.howCalculated}
            </p>
          </div>
        </div>

        {/* 2. Avg. Total Patient Time */}
        <div className={`${S.tile} ${TONES.purple.tile} items-start`}>
          <div className={`${S.iconWrap} ${TONES.purple.icon} mt-1`}>
            <i className="bx bx-time" />
          </div>
          <div className={S.content}>
            <span className={S.label}>{T.avgPatientTime.label}</span>
            <span className={S.value}>{formattedPatientTime}</span>
            <span className={S.subtitle}>{T.avgPatientTime.subtitle}</span>
            {totalMins > 0 && (
              <span
                className={`mt-2 inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                  withinTarget
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {withinTarget
                  ? T.avgPatientTime.withinTargetBadge
                  : `${Math.round(excessMin)} min ${T.avgPatientTime.overTargetSuffix}`}
              </span>
            )}
            <p className="mt-2.5 pt-2 border-t border-line/50 text-[11px] text-content-muted leading-snug">
              {T.avgPatientTime.howCalculated}
            </p>
          </div>
        </div>

        {/* 3. Next-Day Forecast */}
        <div className={`${S.tile} ${TONES.blue.tile} items-start`}>
          <div className={`${S.iconWrap} ${TONES.blue.icon} mt-1`}>
            <i className="bx bx-trending-up" />
          </div>
          <div className={S.content}>
            <span className={S.label}>{T.nextDayForecast.label}</span>
            <div className="flex items-baseline">
              <span className={S.value}>{forecastValue}</span>
              <span className={S.unit}>{T.nextDayForecast.unit}</span>
            </div>
            <span className={S.subtitle}>
              {T.nextDayForecast.subtitlePrefix} {forecastDate} · {T.nextDayForecast.viaPrefix}{' '}
              <span className="font-semibold text-content">{forecastAlgo}</span>
            </span>
            <p className="mt-2.5 pt-2 border-t border-line/50 text-[11px] text-content-muted leading-snug">
              {T.nextDayForecast.howCalculated}
            </p>
          </div>
        </div>

        {/* 4. Recommended Staff */}
        <div className={`${S.tile} ${TONES.green.tile} items-start`}>
          <div className={`${S.iconWrap} ${TONES.green.icon} mt-1`}>
            <i className="bx bx-plus-medical" />
          </div>
          <div className={S.content}>
            <span className={S.label}>{T.recommendedStaff.label}</span>
            <div className="flex items-baseline">
              <span className={S.value}>{recommendedDoctors}</span>
              <span className={S.unit}>{T.recommendedStaff.unit}</span>
            </div>
            <span className={S.subtitle}>{T.recommendedStaff.subtitle}</span>
            {typeof adultDocs === 'number' && typeof pediaDocs === 'number' && (
              <span className="mt-1.5 text-[11px] font-semibold text-content-muted">
                Adult Clinic: <span className="font-mono text-content">{adultDocs}</span> · Pedia Clinic:{' '}
                <span className="font-mono text-content">{pediaDocs}</span>
              </span>
            )}
            {staffWarning && (
              <p className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 leading-snug">
                {staffWarning}
              </p>
            )}
            <p className="mt-2.5 pt-2 border-t border-line/50 text-[11px] text-content-muted leading-snug">
              {T.recommendedStaff.howCalculated}
            </p>
          </div>
        </div>
      </div>

      <AnalyticsExplainer summary={T.explainer.summary} details={T.explainer.details} />
    </div>
  );
}
