/**
 * @fileoverview PHC Waiting Time Compliance Summary component for the Analytics dashboard.
 *
 * Compares actual patient waiting durations against official hospital department standards,
 * detailing compliance percentages across triage, nursing evaluation, physician examination,
 * and medication carryout stages with visual progress bars and plain-English guides.
 *
 * @module app/dashboard/pages/analytics/components/PHCComplianceSummary
 */

'use client';

import DashboardCard from '@/app/dashboard/components/DashboardCard';
import AnalyticsExplainer from '@/app/dashboard/pages/analytics/components/AnalyticsExplainer';
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

/**
 * Formats a minute threshold into plain everyday hours and minutes (e.g. "2 hrs 30 mins").
 *
 * @param minutes - Threshold duration in minutes.
 * @returns Human-readable duration string.
 */
function formatThresholdLabel(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hrUnit = hrs === 1 ? 'hr' : 'hrs';
    return mins === 0 ? `${hrs} ${hrUnit}` : `${hrs} ${hrUnit} ${mins} mins`;
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
  const B = ANALYTICS_STYLES.complianceBar;
  const T = ANALYTICS_TEXTS.compliance;

  if (!data) return null;

  const thresholds = data.thresholds_min || {
    waiting_time: 150,
    evaluate: 30,
    examine_treat: 105,
    carryout: 15,
  };

  const rows = [
    {
      key: 'waiting_time',
      label: T.stages.waitingTime,
      note: T.stageNotes.waitingTime,
      threshold: formatThresholdLabel(thresholds.waiting_time),
      le: data.waiting_time_le,
      gt: data.waiting_time_gt,
    },
    {
      key: 'evaluate',
      label: T.stages.evaluate,
      note: T.stageNotes.evaluate,
      threshold: formatThresholdLabel(thresholds.evaluate),
      le: data.evaluate_le,
      gt: data.evaluate_gt,
    },
    {
      key: 'examine_treat',
      label: T.stages.examineTreat,
      note: T.stageNotes.examineTreat,
      threshold: formatThresholdLabel(thresholds.examine_treat),
      le: data.examine_treat_le,
      gt: data.examine_treat_gt,
    },
    {
      key: 'carryout',
      label: T.stages.carryout,
      note: T.stageNotes.carryout,
      threshold: formatThresholdLabel(thresholds.carryout),
      le: data.carryout_le,
      gt: data.carryout_gt,
    },
  ];

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-check-shield">
      <div className="flex flex-col gap-5">
        <AnalyticsExplainer
          summary={T.explainer.summary}
          details={T.explainer.details}
        />

        {/* KPI Strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={ANALYTICS_STYLES.phcKpiCard}>
            <span className="text-xs font-semibold text-content-muted">{T.patientsSeenLabel}</span>
            <span className="text-2xl font-extrabold text-content">
              {data.patients_seen.toLocaleString()}
            </span>
          </div>
          <div className={ANALYTICS_STYLES.phcKpiCard}>
            <span className="text-xs font-semibold text-content-muted">{T.operatingHoursLabel}</span>
            <span className="text-2xl font-extrabold text-content">
              {data.opd_hours}{' '}
              <span className="text-sm font-normal text-content-muted">
                {T.operatingHoursUnit}
              </span>
            </span>
          </div>
          <div className={ANALYTICS_STYLES.phcKpiCard}>
            <span className="text-xs font-semibold text-content-muted">{T.avgTotalWaitLabel}</span>
            <span className="text-2xl font-extrabold font-mono text-content">
              {formatMinutesToHMS(data.avg_total_waiting_time_min)}
            </span>
          </div>
        </div>

        {/* Compliance Rate Color Key */}
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl border border-line bg-surface-muted/60 text-xs text-content-muted flex-wrap">
          <span className="font-bold text-[11px] uppercase tracking-wider text-content">
            Compliance Rate Key:
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {T.rateLegend.good}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> {T.rateLegend.warn}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> {T.rateLegend.poor}
          </span>
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
                <th className={`${S.th} text-right`}>{T.headers.complianceRate}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = row.le + row.gt;
                const rateNum = total > 0 ? (row.le / total) * 100 : 100;
                const rate = rateNum.toFixed(1);
                const rateColor =
                  rateNum >= 90
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : rateNum >= 75
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400';
                const barFillColor =
                  rateNum >= 90
                    ? 'bg-emerald-500'
                    : rateNum >= 75
                    ? 'bg-amber-500'
                    : 'bg-rose-500';

                return (
                  <tr key={row.key} className={S.row}>
                    <td className={`${S.td} min-w-[230px]`}>
                      <span className="font-bold text-content">{row.label}</span>
                      <p className="mt-0.5 text-xs text-content-subtle leading-snug">
                        {row.note}
                      </p>
                    </td>
                    <td className={`${S.td} whitespace-nowrap font-semibold text-content`}>
                      {row.threshold}
                    </td>
                    <td className={`${S.td} whitespace-nowrap font-mono font-semibold text-emerald-600 dark:text-emerald-400`}>
                      {row.le.toLocaleString()}
                    </td>
                    <td className={`${S.td} whitespace-nowrap font-mono font-semibold text-rose-600 dark:text-rose-400`}>
                      {row.gt.toLocaleString()}
                    </td>
                    <td className={`${S.td} whitespace-nowrap`}>
                      <div className={B.wrap}>
                        <div className={B.track}>
                          <div
                            className={`${B.fill} ${barFillColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, rateNum))}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold w-14 text-right ${rateColor}`}>
                          {rate}%
                        </span>
                      </div>
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
