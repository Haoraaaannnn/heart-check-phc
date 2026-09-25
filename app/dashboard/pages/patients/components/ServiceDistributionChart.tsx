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
import { COLORS } from '@/app/dashboard/pages/patients/constants/patients';
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
        <div className="flex h-[300px] items-center justify-center text-sm italic text-content-subtle">
          {T.empty}
        </div>
      ) : (
        <div className="h-[300px] w-full">
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
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  borderColor: 'var(--color-line, #e5e7eb)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  color: 'var(--color-content, #1f2937)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
