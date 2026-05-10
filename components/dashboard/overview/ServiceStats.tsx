import { DashboardStats } from '@/hooks/dashboard/useOverviewData';

interface ServiceStatsProps {
  deptStats: Record<string, number>;
  stats: DashboardStats;
  isMounted: boolean;
}

const DEPT_COLORS = ['bg-rose-500', 'bg-teal-500', 'bg-orange-400', 'bg-purple-500', 'bg-blue-400'];

export default function ServiceStats({ deptStats, stats, isMounted }: ServiceStatsProps) {
  const servedPercentage =
    stats.todayCount > 0 ? Math.round((stats.served / stats.todayCount) * 100) : 0;
  const pct = isMounted ? servedPercentage : 0;

  return (
    <div className="bg-white/35 rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] border border-white/40 p-8 backdrop-blur-xl flex flex-col gap-8
      dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20">

      {/* By Service */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2 mb-1 dark:text-gray-200">
          By Service
        </h2>
        <p className="text-sm text-gray-400 mb-6">Patients in queue right now</p>

        <div className="flex flex-col gap-5">
          {isMounted && Object.keys(deptStats).length > 0 ? (
            Object.entries(deptStats).map(([dept, count], idx) => {
              const colorClass = DEPT_COLORS[idx % DEPT_COLORS.length];
              const barWidth = `${Math.min((count / Math.max(stats.onQueue, 1)) * 100, 100)}%`;
              return (
                <div key={dept} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                      <span className="text-sm font-bold text-gray-800">{dept}</span>
                    </div>
                    <div className="text-xs text-gray-400 ml-4">{count} waiting</div>
                  </div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full ${colorClass} rounded-full`} style={{ width: barWidth }}></div>
                  </div>
                  <div className="text-lg font-extrabold text-gray-800 w-6 text-right">{count}</div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 italic">No patients currently waiting.</p>
          )}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Ticket Status Breakdown */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-4 dark:text-gray-200">Ticket Status Breakdown</h3>
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `conic-gradient(#10b981 ${pct}%, #f97316 ${pct}% 100%)` }}
          >
            <div className="w-14 h-14 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold text-gray-800">{pct}%</span>
              <span className="text-xs text-gray-400 font-semibold uppercase">Served</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Served
              </span>
              <span className="font-bold text-green-600">{isMounted ? stats.served : '--'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Waiting
              </span>
              <span className="font-bold text-orange-500">{isMounted ? stats.onQueue : '--'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}