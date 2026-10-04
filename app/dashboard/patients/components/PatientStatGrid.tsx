import PatientMetricCard from '@/components/reusables/patientMetricCard';
import PatientHeaderCard from '@/components/reusables/patientHeaderCard';
import { PatientStats } from '@/types/Types';

export default function PatientStatsGrid({ stats }: { stats: PatientStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      <PatientMetricCard>
        <PatientHeaderCard>Total Today</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-[#a8071a] dark:text-[#f87171] self-end">{stats.totalToday}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>In Queue</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-amber-500 dark:text-amber-400 self-end">{stats.inQueue}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>In Service</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 self-end">{stats.inService}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>Served Today</PatientHeaderCard>
        <span className="text-5xl font-extrabold text-teal-600 dark:text-teal-400 self-end">{stats.servedToday}</span>
      </PatientMetricCard>
      <PatientMetricCard>
        <PatientHeaderCard>Avg Wait Time</PatientHeaderCard>
        <span className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 self-end">{stats.avgWaitTime}m</span>
      </PatientMetricCard>
    </div>
  );
}