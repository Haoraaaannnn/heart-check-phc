/**
 * @fileoverview Summary KPI metric cards row for the Cubicles Heatmap section.
 *
 * Displays aggregated facility metrics for the selected operational day including total throughput,
 * average consultation processing speed, average idle intervals, and examination room utilization rate.
 *
 * @module app/dashboard/pages/cubicles/components/HeatmapKpiGrid
 */

'use client';

import { TONES } from '@/app/dashboard/constants/styles';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { HeatmapDayKpis } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface HeatmapKpiGridProps {
  /** Facility-wide performance indicators for the active operational day. */
  kpis: HeatmapDayKpis;
}

/**
 * 4-column metric cards row highlighting overall operational efficiency.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HeatmapKpiGrid({ kpis }: HeatmapKpiGridProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap.kpis;

  const items = [
    {
      key: 'throughput',
      label: T.throughput.label,
      value: `${kpis.totalPatientsServed} pts`,
      subtitle: kpis.peakHour
        ? `Peak: ${kpis.peakHour} (${kpis.peakHourCount} pts)`
        : T.throughput.subtitle,
      icon: 'bx-group',
      tone: TONES.blue,
    },
    {
      key: 'avgSpeed',
      label: T.avgSpeed.label,
      value: kpis.facilityAvgSpeedMinutes > 0 ? `${kpis.facilityAvgSpeedMinutes}m` : '—',
      subtitle: kpis.facilityAvgSpeedMinutes > 0 ? 'Target: 15-20m / pt' : T.avgSpeed.subtitle,
      icon: 'bx-tachometer',
      tone: TONES.green,
    },
    {
      key: 'avgIdle',
      label: T.avgIdle.label,
      value: kpis.totalPatientsServed > 0 ? `${kpis.facilityAvgIdleMinutes}m` : '—',
      subtitle: T.avgIdle.subtitle,
      icon: 'bx-time-five',
      tone: TONES.purple,
    },
    {
      key: 'utilization',
      label: T.utilization.label,
      value: `${kpis.facilityUtilizationPercent}%`,
      subtitle: kpis.mostActiveCubicle
        ? `Lead: ${kpis.mostActiveCubicle} (${kpis.mostActiveCount} pts)`
        : T.utilization.subtitle,
      icon: 'bx-pie-chart-alt-2',
      tone: TONES.rose,
    },
  ];

  return (
    <div className={S.kpiGrid}>
      {items.map((item) => (
        <div key={item.key} className={`${S.kpiCard} ${item.tone.tile}`}>
          <div className={`${S.kpiIconWrap} ${item.tone.icon}`}>
            <i className={`bx ${item.icon}`} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className={S.kpiLabel}>{item.label}</span>
            <span className={S.kpiValue}>{item.value}</span>
            <span className={S.kpiSubtitle}>{item.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
