import MetricCards from '@/components/reusables/metricCards';
import { DashboardStats } from '@/hooks/dashboard/useOverviewData';

interface DashboardMetricsProps {
  stats: DashboardStats;
  avgWaitTime: string;
  isMounted: boolean;
}

export default function DashboardMetrics({ stats, avgWaitTime, isMounted }: DashboardMetricsProps) {
  const val = (v: number | string) => (isMounted ? v : '--');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <MetricCards>
        <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Today Patients</span>
        <span className="text-[#cc3535] text-5xl font-extrabold self-end">{val(stats.todayCount)}</span>
      </MetricCards>

      <MetricCards>
        <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">On Queue</span>
        <span className="text-orange-500 text-5xl font-extrabold self-end">{val(stats.onQueue)}</span>
      </MetricCards>

      <MetricCards>
        <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Served</span>
        <span className="text-green-500 text-5xl font-extrabold self-end">{val(stats.served)}</span>
      </MetricCards>

      <MetricCards>
        <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Avg Waiting Time</span>
        <span className="text-[#cc3535] text-4xl font-extrabold self-end">
          {val(avgWaitTime)} <span className="text-2xl font-bold">min</span>
        </span>
      </MetricCards>
    </div>
  );
}