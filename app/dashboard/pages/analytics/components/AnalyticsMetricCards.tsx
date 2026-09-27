/**
 * @fileoverview Summary metric cards row for the Analytics dashboard page.
 *
 * Visualizes overall system status (Normal, Elevated, Overwhelmed), average total patient
 * duration through the facility, next-day algorithmic volume forecasts, and recommended staff.
 *
 * @module app/dashboard/pages/analytics/components/AnalyticsMetricCards
 */

'use client';

import { TONES } from '@/app/dashboard/constants/styles';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface AnalyticsMetricCardsProps {
  /** Raw analytics payload from the FastAPI backend. */
  data: any;
}

/**
 * 4-column metric row presenting high-level analytical KPI summaries.
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
  const hrs = Math.floor(totalMins / 60);
  const mins = Math.round(totalMins % 60);
  const formattedPatientTime = `${hrs}h ${mins}m`;

  const forecastValue = data.computational_forecasting?.next_day_forecast ?? 0;
  const forecastDate = data.lr_chart_data?.forecast_date || T.nextDayForecast.defaultDate;
  const forecastAlgo = data.computational_forecasting?.best_algorithm ?? 'N/A';

  const recommendedDoctors = data.decision_support?.recommended_doctors ?? 1;

  return (
    <div className={ANALYTICS_STYLES.metricsGrid}>
      {/* 1. System Status Card */}
      <div className={`${SC.base} ${SC[status]}`}>
        <div>
          <span className={SC.eyebrow}>{T.systemStatus.label}</span>
          <p className={SC.value}>{status}</p>
        </div>
        <div>
          <p className={SC.bottleneck}>
            {T.systemStatus.bottleneckPrefix}{' '}
            {primary?.stage_label || bottleneck?.bottleneck_stage || T.systemStatus.noneLabel}
          </p>
          {primary?.reason && <p className={SC.reason}>{primary.reason}</p>}
        </div>
      </div>

      {/* 2. Avg. Total Patient Time */}
      <div className={`${S.tile} ${TONES.purple.tile}`}>
        <div className={`${S.iconWrap} ${TONES.purple.icon}`}>
          <i className="bx bx-time" />
        </div>
        <div className={S.content}>
          <span className={S.label}>{T.avgPatientTime.label}</span>
          <span className={S.value}>{formattedPatientTime}</span>
          <span className={S.subtitle}>{T.avgPatientTime.subtitle}</span>
        </div>
      </div>

      {/* 3. Next-Day Forecast */}
      <div className={`${S.tile} ${TONES.blue.tile}`}>
        <div className={`${S.iconWrap} ${TONES.blue.icon}`}>
          <i className="bx bx-trending-up" />
        </div>
        <div className={S.content}>
          <span className={S.label}>{T.nextDayForecast.label}</span>
          <div className="flex items-baseline">
            <span className={S.value}>{forecastValue}</span>
            <span className={S.unit}>{T.nextDayForecast.unit}</span>
          </div>
          <span className={S.subtitle}>
            {T.nextDayForecast.subtitlePrefix} {forecastDate} · {T.nextDayForecast.viaPrefix} {forecastAlgo}
          </span>
        </div>
      </div>

      {/* 4. Recommended Staff */}
      <div className={`${S.tile} ${TONES.green.tile}`}>
        <div className={`${S.iconWrap} ${TONES.green.icon}`}>
          <i className="bx bx-plus-medical" />
        </div>
        <div className={S.content}>
          <span className={S.label}>{T.recommendedStaff.label}</span>
          <div className="flex items-baseline">
            <span className={S.value}>{recommendedDoctors}</span>
            <span className={S.unit}>{T.recommendedStaff.unit}</span>
          </div>
          <span className={S.subtitle}>{T.recommendedStaff.subtitle}</span>
        </div>
      </div>
    </div>
  );
}
