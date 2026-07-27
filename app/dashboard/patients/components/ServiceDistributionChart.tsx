import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsMetricCards from '@/components/reusables/analyticsMetricCards';
import { COLORS } from '@/app/dashboard/patients/constants/patients';

interface Props {
  data: { name: string; value: number }[];
  historicalFallback?: { name: string; value: number }[];
}

export default function ServiceDistributionChart({ data, historicalFallback }: Props) {
  const hasLiveData = data.length > 0;
  const displayData = hasLiveData ? data : (historicalFallback ?? []);

  return (
    <AnalyticsMetricCards>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">Service Distribution</h2>
        {!hasLiveData && displayData.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            No patients today — showing historical service mix
          </p>
        )}
      </div>

      {displayData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-gray-400 italic">
          No service data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {displayData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </AnalyticsMetricCards>
  );
}