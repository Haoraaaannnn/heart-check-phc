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

function formatThresholdLabel(
  minutes: number,
  units: typeof ANALYTICS_TEXTS.compliance.units
): string {
  if (minutes % 60 === 0) return `${minutes / 60} ${units.hours}`;
  if (minutes > 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}.${Math.round((mins / 60) * 100)} ${units.hours}`;
  }
  return `${minutes} ${units.minutes}`;
}

/**
 * Compliance summary card and table comparing department times to official PHC standards.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function PHCComplianceSummary({ data }: PHCComplianceSummaryProps) {
  const C = ANALYTICS_STYLES.compliance;
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
      threshold: formatThresholdLabel(thresholds.waiting_time, T.units),
      le: data.waiting_time_le,
      gt: data.waiting_time_gt,
    },
    {
      key: 'evaluate',
      label: T.stages.evaluate,
      threshold: formatThresholdLabel(thresholds.evaluate, T.units),
      le: data.evaluate_le,
      gt: data.evaluate_gt,
    },
    {
      key: 'examine_treat',
      label: T.stages.examineTreat,
      threshold: formatThresholdLabel(thresholds.examine_treat, T.units),
      le: data.examine_treat_le,
      gt: data.examine_treat_gt,
    },
    {
      key: 'carryout',
      label: T.stages.carryout,
      threshold: formatThresholdLabel(thresholds.carryout, T.units),
      le: data.carryout_le,
      gt: data.carryout_gt,
    },
  ];

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-check-shield">
      <div className={C.container}>
        {/* KPI Strip */}
        <div className={C.kpiGrid}>
          <div className={C.kpiCard}>
            <span className={C.kpiLabel}>{T.patientsSeenLabel}</span>
            <span className={C.kpiValue}>{data.patients_seen}</span>
          </div>
          <div className={C.kpiCard}>
            <span className={C.kpiLabel}>{T.operatingHoursLabel}</span>
            <span className={C.kpiValue}>
              {data.opd_hours} <span className={C.kpiUnit}>{T.operatingHoursUnit}</span>
            </span>
          </div>
          <div className={C.kpiCard}>
            <span className={C.kpiLabel}>{T.avgTotalWaitLabel}</span>
            <span className={C.kpiValueMono}>
              {formatMinutesToHMS(data.avg_total_waiting_time_min)}
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div className={C.tableWrap}>
          <table className={C.table}>
            <thead>
              <tr className={C.headRow}>
                <th className={C.th}>{T.headers.stage}</th>
                <th className={C.th}>{T.headers.standard}</th>
                <th className={C.th}>{T.headers.withinStandard}</th>
                <th className={C.th}>{T.headers.exceededStandard}</th>
                <th className={C.th}>{T.headers.complianceRate}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = row.le + row.gt;
                const rate = total > 0 ? ((row.le / total) * 100).toFixed(1) : '100.0';
                const rateNum = parseFloat(rate);
                const rateColor =
                  rateNum >= 90
                    ? C.rateOptimal
                    : rateNum >= 75
                    ? C.rateWarning
                    : C.rateCritical;

                return (
                  <tr key={row.key} className={C.row}>
                    <td className={C.tdStage}>{row.label}</td>
                    <td className={C.tdStandard}>{row.threshold}</td>
                    <td className={C.tdWithin}>{row.le}</td>
                    <td className={C.tdExceeded}>{row.gt}</td>
                    <td className={`${C.tdRate} ${rateColor}`}>
                      {rate}{T.units.percent}
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
