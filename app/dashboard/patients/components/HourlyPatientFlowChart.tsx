import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsMetricCards from '@/components/reusables/analyticsMetricCards';

interface Props {
  data: { hour: string; patients: number }[];
}

export default function HourlyPatientFlowChart({ data }: Props) {
  return (
    <AnalyticsMetricCards>
      <h2 className="text-xl font-extrabold mb-6 text-slate-900 dark:text-[#f5f5f5]">Hourly Patient Flow</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(115,115,115,0.15)" />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#a3a3a3' }} />
          <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #2e2e2e', backgroundColor: '#1a1a1a', color: '#f5f5f5' }}
          />
          <Line type="monotone" dataKey="patients" stroke="#a8071a" strokeWidth={2} dot={{ r: 3, fill: '#a8071a' }} />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsMetricCards>
  );
}