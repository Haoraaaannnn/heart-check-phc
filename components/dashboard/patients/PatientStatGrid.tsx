import PatientMetricCard from '@/components/reusables/patientMetricCard';
import PatientHeaderCard from '@/components/reusables/patientHeaderCard';
import { PatientStats } from '@/types/Types';

export default function PatientStatsGrid({ stats }: { stats: PatientStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <PatientMetricCard>
        <PatientHeaderCard>Total Today</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-blue-600 self-end">{stats.totalToday}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>In Queue</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-yellow-600 self-end">{stats.inQueue}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>Served Today</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-green-600 self-end">{stats.servedToday}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>Avg Wait Time</PatientHeaderCard>
        <span className="text-4xl font-extrabold text-red-600 self-end">{stats.avgWaitTime}m</span>
      </PatientMetricCard>
    </div>
  );
}