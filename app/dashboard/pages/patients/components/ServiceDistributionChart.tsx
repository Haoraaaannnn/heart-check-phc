/**
 * @fileoverview Service distribution breakdown chart component.
 *
 * Displays a donut/pie chart of patients seen across various clinic departments
 * with fallback to historical service mix if no patients are present today.
 *
 * @module app/dashboard/pages/patients/components/ServiceDistributionChart
 */

'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import {
  COLORS,
  PATIENTS_STYLES,
  PATIENTS_TOOLTIP_STYLE,
} from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface ServiceDistributionChartProps {
  /** Live service breakdown data for today. */
  data: { name: string; value: number }[];
  /** Historical fallback data when today has 0 patients. */
  historicalFallback?: { name: string; value: number }[];
}

/**
 * Service breakdown donut chart wrapped inside the shared DashboardCard shell.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function ServiceDistributionChart({
  data,
  historicalFallback,
}: ServiceDistributionChartProps) {
  const T = PATIENTS_TEXTS.charts.distribution;
  const C = PATIENTS_STYLES.charts;
  const hasLiveData = data.length > 0;
  const displayData = hasLiveData ? data : (historicalFallback ?? []);

  const subtitle = !hasLiveData && displayData.length > 0
    ? T.historicalFallbackNote
    : T.subtitle;

  return (
    <DashboardCard
      title={T.title}
      subtitle={subtitle}
      icon="bx-pie-chart-alt-2"
    >
      {displayData.length === 0 ? (
        <div className={C.emptyWrap}>
          {T.empty}
        </div>
      ) : (
        <div className={C.chartWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                dataKey="value"
              >
                {displayData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={PATIENTS_TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
