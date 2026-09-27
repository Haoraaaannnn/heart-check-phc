/**
 * @fileoverview Bottleneck Stage Table component for the Analytics dashboard page.
 *
 * Details average wait times, patient volumes, severity levels, and clinical reasoning
 * across each stage of outpatient care (registration, triage, consultation, carryout).
 *
 * @module app/dashboard/pages/analytics/components/BottleneckStageTable
 */

'use client';

import DashboardCard from '@/app/dashboard/components/DashboardCard';
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

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-git-commit">
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

              return (
                <tr key={stage.stage_key} className={S.row}>
                  <td className={`${S.td} whitespace-nowrap font-bold text-content`}>
                    {stage.stage_label}
                  </td>
                  <td className={`${S.td} whitespace-nowrap font-mono text-content`}>
                    {stage.level === 'No Data' ? '—' : formatMinutesToHMS(stage.avg_minutes)}
                  </td>
                  <td className={`${S.td} whitespace-nowrap`}>
                    {stage.patient_count}
                  </td>
                  <td className={`${S.td} whitespace-nowrap`}>
                    <span className={`${B.base} ${badgeStyle}`}>
                      {stage.level}
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
    </DashboardCard>
  );
}
