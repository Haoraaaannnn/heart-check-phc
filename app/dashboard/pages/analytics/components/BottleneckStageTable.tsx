/**
 * @fileoverview Bottleneck Stage Table component for the Analytics dashboard page.
 *
 * Details average wait times, patient volumes, severity levels, visual duration bars,
 * and plain-language definitions across each stage of outpatient care.
 *
 * @module app/dashboard/pages/analytics/components/BottleneckStageTable
 */

'use client';

import DashboardCard from '@/app/dashboard/components/DashboardCard';
import AnalyticsExplainer from '@/app/dashboard/pages/analytics/components/AnalyticsExplainer';
import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface Stage {
  stage_key: string;
  stage_label: string;
  avg_minutes: number;
  patient_count: number;
  level: 'Normal' | 'Elevated' | 'Overwhelmed' | 'No Data';
  reason: string;
}

interface BottleneckStageTableProps {
  /** Array of stage analysis objects. */
  stages: Stage[];
}

const BAR_COLORS: Record<Stage['level'], string> = {
  Normal: 'bg-emerald-500',
  Elevated: 'bg-amber-500',
  Overwhelmed: 'bg-rose-500',
  'No Data': 'bg-slate-300 dark:bg-slate-700',
};

/**
 * Queue bottleneck stage breakdown table wrapped in DashboardCard.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function BottleneckStageTable({ stages }: BottleneckStageTableProps) {
  const S = ANALYTICS_STYLES.table;
  const B = ANALYTICS_STYLES.levelBadge;
  const T = ANALYTICS_TEXTS.bottleneckTable;

  if (!stages || stages.length === 0) {
    return (
      <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-git-commit">
        <p className="py-8 text-center text-sm text-content-subtle">{T.empty}</p>
      </DashboardCard>
    );
  }

  const activeStages = stages.filter((s) => s.level !== 'No Data');
  const maxMinutes = Math.max(...activeStages.map((s) => s.avg_minutes), 60);
  const slowestStageKey =
    activeStages.length > 0
      ? activeStages.reduce((best, curr) =>
          curr.avg_minutes > best.avg_minutes ? curr : best
        ).stage_key
      : null;

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-git-commit">
      <div className="flex flex-col gap-4">
        <AnalyticsExplainer
          summary={T.explainer.summary}
          details={T.explainer.details}
        />

        {/* Status Threshold Key & Legend */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-line bg-surface-muted/60 text-xs text-content-muted flex-wrap">
          <span className="font-bold text-[11px] uppercase tracking-wider text-content">
            Status Threshold Key:
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal Flow (&le; 30m)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Elevated Delay (30–60m)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Capacity Threshold Exceeded (&gt; 60m)
          </span>
        </div>

        <div className={S.wrap}>
          <table className={S.table}>
            <thead>
              <tr className={S.headRow}>
                <th className={S.th}>{T.headers.stage}</th>
                <th className={S.th}>{T.headers.avgTime}</th>
                <th className={S.th}>{T.headers.patients}</th>
                <th className={S.th}>{T.headers.level}</th>
                <th className={S.th}>{T.headers.reason}</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => {
                const badgeStyle = B[stage.level] || B['No Data'];
                const barColor = BAR_COLORS[stage.level] || BAR_COLORS['No Data'];
                const isSlowest = stage.stage_key === slowestStageKey && stage.avg_minutes > 0;
                const widthPct =
                  stage.level === 'No Data'
                    ? 0
                    : Math.min(100, Math.max(4, Math.round((stage.avg_minutes / maxMinutes) * 100)));
                const definition = T.stageDefinitions[stage.stage_key];

                return (
                  <tr key={stage.stage_key} className={S.row}>
                    <td className={`${S.td} min-w-[230px]`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-content whitespace-nowrap">
                          {stage.stage_label}
                        </span>
                        {isSlowest && (
                          <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 whitespace-nowrap">
                            {T.primaryBadge}
                          </span>
                        )}
                      </div>
                      {definition && (
                        <p className="mt-0.5 text-xs text-content-subtle leading-snug">
                          {definition}
                        </p>
                      )}
                    </td>
                    <td className={`${S.td} whitespace-nowrap font-mono text-content`}>
                      {stage.level === 'No Data' ? (
                        '—'
                      ) : (
                        <div className="flex flex-col gap-1 min-w-[110px]">
                          <span className="font-bold">
                            {formatMinutesToHMS(stage.avg_minutes)}
                          </span>
                          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#262626] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={`${S.td} whitespace-nowrap font-mono font-semibold text-content`}>
                      {stage.patient_count.toLocaleString()}
                    </td>
                    <td className={`${S.td} whitespace-nowrap`}>
                      <span className={`${B.base} ${badgeStyle}`}>
                        {T.levels[stage.level] ?? stage.level}
                      </span>
                    </td>
                    <td className={`${S.td} max-w-md leading-relaxed text-content-muted`}>
                      {stage.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardCard>
  );
}
