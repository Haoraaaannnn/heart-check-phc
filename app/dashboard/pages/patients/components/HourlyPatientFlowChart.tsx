/**
 * @fileoverview Hourly patient flow chart component.
 *
 * Renders an hourly intake line chart illustrating patient registrations
 * through outpatient department operational hours.
 *
 * @module app/dashboard/pages/patients/components/HourlyPatientFlowChart
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import {
  PATIENTS_STYLES,
  PATIENTS_TOOLTIP_STYLE,
} from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface HourlyPatientFlowChartProps {
  /** Array of hourly count data points. */
  data: { hour: string; patients: number }[];
}

/**
 * Hourly patient registration curve wrapped in DashboardCard.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HourlyPatientFlowChart({ data }: HourlyPatientFlowChartProps) {
  const T = PATIENTS_TEXTS.charts.hourlyFlow;
  const C = PATIENTS_STYLES.charts;

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-line-chart"
    >
      <div className={C.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #e5e7eb)" opacity={0.6} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: 'var(--color-content-muted, #6b7280)' }}
              axisLine={{ stroke: 'var(--color-line, #e5e7eb)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--color-content-muted, #6b7280)' }}
              axisLine={{ stroke: 'var(--color-line, #e5e7eb)' }}
              tickLine={false}
            />
            <Tooltip contentStyle={PATIENTS_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="patients"
              name={T.patientsLabel}
              stroke="#cc3535"
              strokeWidth={3}
              dot={{ r: 4, fill: '#cc3535', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
