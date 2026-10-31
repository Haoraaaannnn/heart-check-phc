'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { useDashboardTheme } from '@/app/dashboard/hooks/useDashboardTheme';
import { HOURLY_CHART, TOOLTIP_BASE_STYLE } from '@/app/dashboard/constants/charts';
import { SECTIONS } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';

const C = SECTIONS.hourlyArrivals;

interface HourlyArrivalsChartProps {
  hourlyData: { time: string; patients: number }[];
  isMounted: boolean;
}

/** Bar chart of patient arrivals per hour today. Colors adapt to light/dark via useDashboardTheme. */
export default function HourlyArrivalsChart({ hourlyData, isMounted }: HourlyArrivalsChartProps) {
  const { chartColors } = useDashboardTheme();

  const totalArrivals = isMounted
    ? hourlyData.reduce((acc, curr) => acc + curr.patients, 0)
    : 0;

  const peakHour = isMounted
    ? hourlyData.reduce(
        (max, curr) => (curr.patients > max.patients ? curr : max),
        { time: '--', patients: 0 }
      )
    : { time: '--', patients: 0 };

  return (
    <DashboardCard
      title={C.title}
      subtitle={C.subtitle}
      icon={C.icon}
      action={
        isMounted && totalArrivals > 0 ? (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {peakHour.patients > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 whitespace-nowrap">
                <i className="bx bx-trending-up text-sm" />
                <span>Peak:</span>
                <span className="font-mono font-bold">{peakHour.time}</span>
                <span className="text-[11px] opacity-80">({peakHour.patients} arrivals)</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-muted px-2.5 py-1 text-xs font-semibold text-content-muted whitespace-nowrap">
              <span>Total Intake:</span>
              <span className="font-mono font-bold text-content">{totalArrivals}</span>
            </span>
          </div>
        ) : undefined
      }
    >
      <div style={{ width: '100%', height: HOURLY_CHART.height }}>
        {isMounted ? (
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={hourlyData} margin={HOURLY_CHART.margin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: HOURLY_CHART.tickFontSize, fill: chartColors.axis }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: HOURLY_CHART.tickFontSize, fill: chartColors.axis }}
                axisLine={false}
                tickLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, HOURLY_CHART.minYMax)]}
              />
              <Tooltip
                cursor={{ fill: chartColors.cursor }}
                contentStyle={{
                  ...TOOLTIP_BASE_STYLE,
                  backgroundColor: chartColors.tooltipBg,
                  color: chartColors.tooltipText,
                }}
                formatter={(value) => [`${value} patients`, C.tooltipSeriesLabel]}
              />
              <Bar
                dataKey="patients"
                fill={chartColors.bar}
                radius={HOURLY_CHART.barRadius}
                maxBarSize={HOURLY_CHART.maxBarSize}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${DASH.card.empty}`}>
            {C.loadingText}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}