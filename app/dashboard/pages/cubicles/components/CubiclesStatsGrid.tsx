/**
 * @fileoverview Summary metric cards row for clinical cubicles.
 *
 * Employs dashboard design system tones (rose, blue, green, amber),
 * round icon badges, and numeric counters.
 *
 * @module app/dashboard/pages/cubicles/components/CubiclesStatsGrid
 */

import { TONES } from '@/app/dashboard/constants/styles';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { CubiclesStats } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface CubiclesStatsGridProps {
  /** Aggregate cubicle counts. */
  stats: CubiclesStats;
}

/**
 * 4-column metric row displaying Total, Available, Occupied, and Unavailable counts.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function CubiclesStatsGrid({ stats }: CubiclesStatsGridProps) {
  const S = CUBICLES_STYLES.metricCard;
  const T = CUBICLES_TEXTS.metrics;

  const items = [
    {
      key: 'total',
      label: T.total.label,
      value: stats.total,
      subtitle: T.total.subtitle,
      icon: 'bxs-clinic',
      tone: TONES.blue,
    },
    {
      key: 'available',
      label: T.available.label,
      value: stats.available,
      subtitle: T.available.subtitle,
      icon: 'bx-check-circle',
      tone: TONES.green,
    },
    {
      key: 'occupied',
      label: T.occupied.label,
      value: stats.occupied,
      subtitle: T.occupied.subtitle,
      icon: 'bx-user-check',
      tone: TONES.rose,
    },
    {
      key: 'unavailable',
      label: T.unavailable.label,
      value: stats.unavailable,
      subtitle: T.unavailable.subtitle,
      icon: 'bx-wrench',
      tone: TONES.amber,
    },
  ];

  return (
    <div className={CUBICLES_STYLES.metricsGrid}>
      {items.map((item) => (
        <div key={item.key} className={`${S.tile} ${item.tone.tile}`}>
          <div className={`${S.iconWrap} ${item.tone.icon}`}>
            <i className={`bx ${item.icon}`} />
          </div>
          <div className={S.content}>
            <span className={S.label}>{item.label}</span>
            <span className={S.value}>{item.value}</span>
            <span className={S.subtitle}>{item.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
