import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsMetricCards from '@/components/reusables/analyticsMetricCards';
import { COLORS } from '@/app/dashboard/patients/constants/patients';

interface Props {
  data: { name: string; value: number }[];
}

export default function ServiceDistributionChart({ data }: Props) {
  return (
    <AnalyticsMetricCards>
      <h2 className="text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200">Service Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </AnalyticsMetricCards>
  );
}