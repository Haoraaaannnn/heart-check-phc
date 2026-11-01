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
import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';

interface PatientStatGridProps {
  /** Summary patient statistics. */
  stats: PatientStats;
}

interface MetricCardDef {
  key: string;
  label: string;
  value: number | string;
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

  const servedPercent =
    stats.totalToday > 0 ? Math.round((stats.servedToday / stats.totalToday) * 100) : 0;

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
      value: stats.avgWaitTime > 0 ? formatMinutesToHMS(stats.avgWaitTime) : '--:--:--',
      unit: T.avgWaitTime.unit,
      subtitle: T.avgWaitTime.subtitle,
      icon: 'bx-hourglass',
      tone: 'purple',
    },
  ];

  return (
    <div className={PATIENTS_STYLES.metricsGrid}>
      {items.map((item) => {
        const toneStyle = TONES[item.tone] ?? TONES.blue;

        return (
          <div key={item.key} className={`${S.tile} ${toneStyle.tile}`}>
            <div className={`${S.iconWrap} ${toneStyle.icon}`}>
              <i className={`bx ${item.icon}`} />
            </div>

            <div className={S.content}>
              <span className={S.label}>{item.label}</span>
              <div className="flex items-baseline flex-wrap">
                <span className={S.value}>{item.value}</span>
                {item.unit && <span className={S.unit}>{item.unit}</span>}
                {item.key === 'servedToday' && stats.totalToday > 0 && (
                  <span className="ml-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    / {stats.totalToday}
                  </span>
                )}
              </div>
              <span className={S.subtitle}>{item.subtitle}</span>

              {item.key === 'totalToday' && (
                <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-content-muted">
                    <span>Served vs Total:</span>
                    <span className="font-mono font-bold text-content">
                      {stats.servedToday} of {stats.totalToday} ({servedPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/60">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-rose-600 dark:bg-rose-400"
                      style={{ width: `${Math.min(servedPercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {item.key === 'servedToday' && (
                <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-content-muted">
                    <span>Completed:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {servedPercent}%
                    </span>
                  </div>
                  <span className="text-[11px] text-content-muted">
                    {stats.servedToday} out of {stats.totalToday} completed
                  </span>
                </div>
              )}

              {item.key === 'inQueue' && (
                <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-col gap-1">
                  <span className="text-[11px] text-content-muted">
                    {stats.inQueue} waiting &bull; {stats.inService} in care
                  </span>
                </div>
              )}

              {item.key === 'avgWaitTime' && (
                <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-col gap-1">
                  <span className="text-[11px] text-content-muted">
                    PHC Target: &le; 150m queue time
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
