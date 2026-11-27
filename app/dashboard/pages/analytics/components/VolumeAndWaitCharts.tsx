/**
 * @fileoverview Volume and wait-time charts orchestrator component for the Analytics dashboard.
 *
 * Coordinates daily patient volume, hourly arrival/process curves, interactive
 * single-day drill-down inspection, and stage-by-stage wait time trends.
 *
 * @module app/dashboard/pages/analytics/components/VolumeAndWaitCharts
 */

'use client';

import { useMemo } from 'react';
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';
import {
  useDailyDrilldown,
  type DrilldownHourlyPoint,
} from '@/app/dashboard/pages/analytics/hooks/useDailyDrilldown';
import DailyVolumeChartCard, {
  type DailyVolumeRow,
} from '@/app/dashboard/pages/analytics/components/DailyVolumeChartCard';
import HourlyPatternChartCard, {
  type HourlyChartPoint,
} from '@/app/dashboard/pages/analytics/components/HourlyPatternChartCard';
import StageWaitTrendsChartCard, {
  type StageTrendRow,
} from '@/app/dashboard/pages/analytics/components/StageWaitTrendsChartCard';
import DailyDrillDownDetail from '@/app/dashboard/pages/analytics/components/DailyDrillDownDetail';

interface RawDailySummaryRow {
  date?: string;
  visit_date?: string;
  total_patients?: number;
  avg_total_time?: number | null;
  avg_wait_registration?: number | null;
  avg_service_registration?: number | null;
  avg_wait_consultation?: number | null;
  avg_service_consultation?: number | null;
  avg_service_carryout?: number | null;
}

interface RawHourlyPatternRow {
  hour: number;
  time_label: string;
  avg_patients?: number;
  kiosk_patients?: number | null;
  reg_patients?: number;
  consult_patients?: number;
  carryout_patients?: number;
  avg_wait_registration?: number | null;
  avg_service_registration?: number | null;
  avg_wait_consultation?: number | null;
  avg_service_consultation?: number | null;
  avg_service_carryout?: number | null;
}

interface VolumeAndWaitChartsProps {
  /** Array of daily summary logs. */
  dailySummary: RawDailySummaryRow[];
  /** Array of hourly pattern intake points. */
  hourlyPattern: RawHourlyPatternRow[];
}

type EnrichedDailyRow = DailyVolumeRow & StageTrendRow & {
  avg_total_time?: number;
  avg_wait_registration?: number;
  avg_wait_consultation?: number;
};

/**
 * Adds a trailing N-day moving average alongside raw daily volume.
 *
 * @param data - Normalized daily records.
 * @param windowSize - Rolling window day count.
 * @returns Array of daily records enriched with `moving_avg`.
 */
function withMovingAverage(
  data: Array<RawDailySummaryRow & { date: string; visit_date: string }>,
  windowSize: number
): EnrichedDailyRow[] {
  return data.map((row, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const windowSlice = data.slice(start, i + 1);
    const avg =
      windowSlice.reduce((sum, r) => sum + (r.total_patients || 0), 0) / windowSlice.length;
    return {
      date: row.date,
      visit_date: row.visit_date,
      total_patients: row.total_patients ?? 0,
      moving_avg: Math.round(avg * 10) / 10,
      avg_wait_registration: row.avg_wait_registration ?? undefined,
      avg_service_registration: row.avg_service_registration ?? undefined,
      avg_wait_consultation: row.avg_wait_consultation ?? undefined,
      avg_service_consultation: row.avg_service_consultation ?? undefined,
      avg_service_carryout: row.avg_service_carryout ?? undefined,
      avg_total_time: row.avg_total_time ?? undefined,
    };
  });
}

/**
 * Multi-chart section displaying volume history, hourly patterns, and wait time curves.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function VolumeAndWaitCharts({
  dailySummary,
  hourlyPattern,
}: VolumeAndWaitChartsProps) {
  const { isDark } = useDashboardTheme();
  const T = ANALYTICS_TEXTS.volumeCharts;

  const {
    selectedDate,
    drilldownData,
    loading: drilldownLoading,
    error: drilldownError,
    selectDate,
    clearSelectedDate,
    retry,
  } = useDailyDrilldown();

  const enrichedDaily = useMemo(() => {
    const normalized = (dailySummary || []).map((row) => {
      const dateVal = row.date || row.visit_date || '';
      return {
        ...row,
        date: dateVal,
        visit_date: dateVal,
      };
    });
    return withMovingAverage(normalized, 7);
  }, [dailySummary]);

  const fallbackSummary = useMemo(() => {
    if (!selectedDate) return undefined;
    const match = enrichedDaily.find(
      (d) => (d.date || d.visit_date) === selectedDate
    );
    if (!match) return undefined;
    return {
      total_patients: match.total_patients,
      avg_total_time: match.avg_total_time,
      avg_wait_registration: match.avg_wait_registration,
      avg_wait_consultation: match.avg_wait_consultation,
    };
  }, [selectedDate, enrichedDaily]);

  const isHistorical = Boolean(
    drilldownData?.is_historical ?? drilldownData?.summary?.is_historical
  );

  const hasKioskData = useMemo(() => {
    if (selectedDate && drilldownData?.hourly_pattern?.length) {
      return drilldownData.hourly_pattern.some(
        (pt) => pt.kiosk_patients !== null && pt.kiosk_patients !== undefined
      );
    }
    return (hourlyPattern || []).some(
      (pt) => pt.kiosk_patients !== null && pt.kiosk_patients !== undefined
    );
  }, [selectedDate, drilldownData, hourlyPattern]);

  const activeHourlyData: HourlyChartPoint[] = useMemo(() => {
    const baseHourly = hourlyPattern || [];
    if (!selectedDate || !drilldownData?.hourly_pattern?.length) {
      return baseHourly.map((hp) => ({
        hour: hp.hour,
        time_label: hp.time_label,
        avg_patients: hp.avg_patients ?? 0,
        selected_day_patients: undefined,
        kiosk_patients: hp.kiosk_patients ?? undefined,
        reg_patients: hp.reg_patients ?? 0,
        consult_patients: hp.consult_patients ?? 0,
        carryout_patients: hp.carryout_patients ?? 0,
        avg_wait_registration: hp.avg_wait_registration ?? undefined,
        avg_service_registration: hp.avg_service_registration ?? undefined,
        avg_wait_consultation: hp.avg_wait_consultation ?? undefined,
        avg_service_consultation: hp.avg_service_consultation ?? undefined,
        avg_service_carryout: hp.avg_service_carryout ?? undefined,
      }));
    }

    const drilldownMap = new Map<number, DrilldownHourlyPoint>();
    for (const point of drilldownData.hourly_pattern) {
      drilldownMap.set(point.hour, point);
    }

    return baseHourly.map((hp) => {
      const dd = drilldownMap.get(hp.hour);
      return {
        hour: hp.hour,
        time_label: hp.time_label,
        avg_patients: hp.avg_patients ?? 0,
        selected_day_patients: dd?.avg_patients ?? 0,
        kiosk_patients:
          dd?.kiosk_patients !== null && dd?.kiosk_patients !== undefined
            ? dd.kiosk_patients
            : undefined,
        reg_patients: dd?.reg_patients ?? 0,
        consult_patients: dd?.consult_patients ?? 0,
        carryout_patients: dd?.carryout_patients ?? 0,
        avg_wait_registration: dd?.avg_wait_registration ?? undefined,
        avg_service_registration: dd?.avg_service_registration ?? undefined,
        avg_wait_consultation: dd?.avg_wait_consultation ?? undefined,
        avg_service_consultation: dd?.avg_service_consultation ?? undefined,
        avg_service_carryout: dd?.avg_service_carryout ?? undefined,
      };
    });
  }, [selectedDate, drilldownData, hourlyPattern]);

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface, #ffffff)',
    borderColor: 'var(--color-line, #e5e7eb)',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    color: 'var(--color-content, #1f2937)',
    fontSize: '12px',
    fontWeight: 600,
  };

  const handleDateSelect = (dateStr?: string) => {
    if (!dateStr) return;
    selectDate(dateStr);
  };

  return (
    <div className="flex flex-col gap-6">
      {!selectedDate && (
        <div className={ANALYTICS_STYLES.drilldown.hintBanner}>
          <div className={ANALYTICS_STYLES.drilldown.hintContent}>
            <i className={`bx bx-mouse-alt ${ANALYTICS_STYLES.drilldown.hintIcon}`} />
            <span>{T.clickHint}</span>
          </div>
        </div>
      )}

      <div className={ANALYTICS_STYLES.chartGrid}>
        <DailyVolumeChartCard
          data={enrichedDaily}
          selectedDate={selectedDate}
          axisColor={axisColor}
          gridColor={gridColor}
          onSelectDate={handleDateSelect}
        />

        <HourlyPatternChartCard
          data={activeHourlyData}
          selectedDate={selectedDate}
          isHistorical={isHistorical}
          hasKioskData={hasKioskData}
          axisColor={axisColor}
          gridColor={gridColor}
          tooltipStyle={tooltipStyle}
          onClearSelectedDate={clearSelectedDate}
        />
      </div>

      {selectedDate && (
        <DailyDrillDownDetail
          date={selectedDate}
          drilldown={drilldownData}
          loading={drilldownLoading}
          error={drilldownError}
          onClose={clearSelectedDate}
          onRetry={retry}
          fallbackSummary={fallbackSummary}
        />
      )}

      <StageWaitTrendsChartCard
        data={enrichedDaily}
        selectedDate={selectedDate}
        axisColor={axisColor}
        gridColor={gridColor}
        tooltipStyle={tooltipStyle}
        onSelectDate={handleDateSelect}
      />
    </div>
  );
}
