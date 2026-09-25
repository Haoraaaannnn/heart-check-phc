/**
 * @fileoverview Metric card row for patient statistics on the Patients dashboard page.
 *
 * Employs the dashboard design system's tone styles (rose, blue, green, purple, amber),
 * icon badges, and typography hierarchy.
 *
 * @module app/dashboard/pages/patients/components/PatientStatGrid
 */

import { PatientStats } from '@/types/Types';
import { TONES, type ToneKey } from '@/app/dashboard/constants/styles';
import { PATIENTS_STYLES } from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface PatientStatGridProps {
  /** Summary patient statistics. */
  stats: PatientStats;
}

interface MetricCardDef {
  key: string;
  label: string;
  value: number;
  unit?: string;
  subtitle: string;
  icon: string;
  tone: ToneKey;
}

/**
 * 5-column metric summary row highlighting patient totals and queue flow.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function PatientStatGrid({ stats }: PatientStatGridProps) {
  const S = PATIENTS_STYLES.metricCard;
  const T = PATIENTS_TEXTS.metrics;

  const items: MetricCardDef[] = [
    {
      key: 'totalToday',
      label: T.totalToday.label,
      value: stats.totalToday,
      subtitle: T.totalToday.subtitle,
      icon: 'bxs-group',
      tone: 'rose',
    },
    {
      key: 'inQueue',
      label: T.inQueue.label,
      value: stats.inQueue,
      subtitle: T.inQueue.subtitle,
      icon: 'bx-time-five',
      tone: 'amber',
    },
    {
      key: 'inService',
      label: T.inService.label,
      value: stats.inService,
      subtitle: T.inService.subtitle,
      icon: 'bx-user-voice',
      tone: 'blue',
    },
    {
      key: 'servedToday',
      label: T.servedToday.label,
      value: stats.servedToday,
      subtitle: T.servedToday.subtitle,
      icon: 'bx-check-double',
      tone: 'green',
    },
    {
      key: 'avgWaitTime',
      label: T.avgWaitTime.label,
      value: stats.avgWaitTime,
      unit: T.avgWaitTime.unit,
      subtitle: T.avgWaitTime.subtitle,
      icon: 'bx-hourglass',
      tone: 'purple',
    },
  ];

  return (
    <div className={PATIENTS_STYLES.metricsGrid}>
      {items.map((item) => {
        const toneStyle = TONES[item.tone];

        return (
          <div key={item.key} className={`${S.tile} ${toneStyle.tile}`}>
            <div className={`${S.iconWrap} ${toneStyle.icon}`}>
              <i className={`bx ${item.icon}`} />
            </div>

            <div className={S.content}>
              <span className={S.label}>{item.label}</span>
              <div className="flex items-baseline">
                <span className={S.value}>{item.value}</span>
                {item.unit && <span className={S.unit}>{item.unit}</span>}
              </div>
              <span className={S.subtitle}>{item.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
