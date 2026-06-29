import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsMetricCards from '@/components/reusables/analyticsMetricCards';

interface Props {
  data: { hour: string; patients: number }[];
}

export default function HourlyPatientFlowChart({ data }: Props) {
  return (
    <AnalyticsMetricCards>
      <h2 className="text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200">Hourly Patient Flow</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="patients" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsMetricCards>
  );
}