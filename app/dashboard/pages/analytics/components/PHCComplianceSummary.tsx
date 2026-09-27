/**
 * @fileoverview PHC Waiting Time Compliance Summary component for the Analytics dashboard.
 *
 * Compares actual patient waiting durations against official hospital department standards,
 * detailing compliance percentages across triage, nursing evaluation, physician examination,
 * and medication carryout stages.
 *
 * @module app/dashboard/pages/analytics/components/PHCComplianceSummary
 */

'use client';

import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { formatMinutesToHMS } from '@/utils/formatMinutesToHMS';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface PHCComplianceData {
  waiting_time_le: number;
  waiting_time_gt: number;
  evaluate_le: number;
  evaluate_gt: number;
  examine_treat_le: number;
  examine_treat_gt: number;
  carryout_le: number;
  carryout_gt: number;
  avg_total_waiting_time_min: number;
  patients_seen: number;
  opd_hours: number;
  thresholds_min: {
    waiting_time: number;
    evaluate: number;
    examine_treat: number;
    carryout: number;
  };
}

interface PHCComplianceSummaryProps {
  /** Compliance metrics payload. */
  data: PHCComplianceData | undefined | null;
}

function formatThresholdLabel(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} hrs`;
  if (minutes > 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}.${Math.round((mins / 60) * 100)} hrs`;
  }
  return `${minutes} mins`;
}

/**
 * Compliance summary card and table comparing department times to official PHC standards.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function PHCComplianceSummary({ data }: PHCComplianceSummaryProps) {
  const S = ANALYTICS_STYLES.table;
  const T = ANALYTICS_TEXTS.compliance;

  if (!data) return null;

  const thresholds = data.thresholds_min || {
    waiting_time: 120,
    evaluate: 30,
    examine_treat: 45,
    carryout: 30,
  };

  const rows = [
    {
      key: 'waiting_time',
      label: T.stages.waitingTime,
      threshold: formatThresholdLabel(thresholds.waiting_time),
      le: data.waiting_time_le,
      gt: data.waiting_time_gt,
    },
    {
      key: 'evaluate',
      label: T.stages.evaluate,
      threshold: formatThresholdLabel(thresholds.evaluate),
      le: data.evaluate_le,
      gt: data.evaluate_gt,
    },
    {
      key: 'examine_treat',
      label: T.stages.examineTreat,
      threshold: formatThresholdLabel(thresholds.examine_treat),
      le: data.examine_treat_le,
      gt: data.examine_treat_gt,
    },
    {
      key: 'carryout',
      label: T.stages.carryout,
      threshold: formatThresholdLabel(thresholds.carryout),
      le: data.carryout_le,
      gt: data.carryout_gt,
    },
  ];

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-check-shield">
      <div className="flex flex-col gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-line bg-surface-muted/40 p-4">
            <span className="text-xs font-semibold text-content-muted">{T.patientsSeenLabel}</span>
            <span className="text-2xl font-extrabold text-content">{data.patients_seen}</span>
          </div>
          <div className="flex flex-col rounded-xl border border-line bg-surface-muted/40 p-4">
            <span className="text-xs font-semibold text-content-muted">{T.operatingHoursLabel}</span>
            <span className="text-2xl font-extrabold text-content">
              {data.opd_hours} <span className="text-sm font-normal text-content-muted">{T.operatingHoursUnit}</span>
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-line bg-surface-muted/40 p-4">
            <span className="text-xs font-semibold text-content-muted">{T.avgTotalWaitLabel}</span>
            <span className="text-2xl font-extrabold font-mono text-content">
              {formatMinutesToHMS(data.avg_total_waiting_time_min)}
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div className={S.wrap}>
          <table className={S.table}>
            <thead>
              <tr className={S.headRow}>
                <th className={S.th}>{T.headers.stage}</th>
                <th className={S.th}>{T.headers.standard}</th>
                <th className={S.th}>{T.headers.withinStandard}</th>
                <th className={S.th}>{T.headers.exceededStandard}</th>
                <th className={S.th}>{T.headers.complianceRate}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = row.le + row.gt;
                const rate = total > 0 ? ((row.le / total) * 100).toFixed(1) : '100.0';
                const rateNum = parseFloat(rate);
                const rateColor =
                  rateNum >= 90
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : rateNum >= 75
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400';

                return (
                  <tr key={row.key} className={S.row}>
                    <td className={`${S.td} font-bold text-content`}>{row.label}</td>
                    <td className={`${S.td} font-medium text-content-muted`}>{row.threshold}</td>
                    <td className={`${S.td} font-mono text-emerald-600 dark:text-emerald-400`}>
                      {row.le}
                    </td>
                    <td className={`${S.td} font-mono text-rose-600 dark:text-rose-400`}>
                      {row.gt}
                    </td>
                    <td className={`${S.td} font-mono font-bold ${rateColor}`}>
                      {rate}%
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
