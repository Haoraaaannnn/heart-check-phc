import { DashboardStats } from '@/app/dashboard/hooks/useOverviewData';
import { themeTokens, sizeTokens } from '@/constants/themeTokens';

interface ServiceStatsProps {
  deptStats: Record<string, number>;
  stats: DashboardStats;
  isMounted: boolean;
}

const DEPT_COLORS = ['bg-rose-500', 'bg-teal-500', 'bg-orange-400', 'bg-purple-500', 'bg-emerald-400'];

export default function ServiceStats({ deptStats, stats, isMounted }: ServiceStatsProps) {
  const servedPercentage =
    stats.todayCount > 0 ? Math.round((stats.served / stats.todayCount) * 100) : 0;
  const pct = isMounted ? servedPercentage : 0;

  return (
    <div className={`p-6 ${themeTokens.surface.card} ${sizeTokens.radius.lg} flex flex-col gap-6`}>

      {/* By Service */}
      <div>
        <h2 className={`text-lg font-bold ${themeTokens.text.primary} flex items-center gap-2 mb-1`}>
          By Service
        </h2>
        <p className={`text-xs ${themeTokens.text.muted} mb-5`}>Patients in queue right now</p>

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
                      <span className={`text-sm font-bold ${themeTokens.text.primary}`}>{dept}</span>
                    </div>
                    <div className={`text-xs ${themeTokens.text.muted} ml-4`}>{count} waiting</div>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 dark:bg-[#242424] rounded-full overflow-hidden shrink-0">
                    <div className={`h-full ${colorClass} rounded-full`} style={{ width: barWidth }}></div>
                  </div>
                  <div className={`text-lg font-extrabold ${themeTokens.text.primary} w-6 text-right`}>{count}</div>
                </div>
              );
            })
          ) : (
            <p className={`text-sm ${themeTokens.text.muted} italic`}>No patients currently waiting.</p>
          )}
        </div>
      </div>

      <hr className={`border-t ${themeTokens.border.default}`} />

      {/* Ticket Status Breakdown */}
      <div>
        <h3 className={`text-sm font-bold ${themeTokens.text.primary} mb-4`}>Ticket Status Breakdown</h3>
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `conic-gradient(#10b981 ${pct}%, #f97316 ${pct}% 100%)` }}
          >
            <div className="w-14 h-14 bg-white dark:bg-[#1a1a1a] rounded-full flex flex-col items-center justify-center">
              <span className={`text-lg font-extrabold ${themeTokens.text.primary}`}>{pct}%</span>
              <span className={`text-xs ${themeTokens.text.muted} font-semibold uppercase`}>Served</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className={`flex items-center gap-2 ${themeTokens.text.secondary} font-semibold`}>
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Served
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">{isMounted ? stats.served : '--'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={`flex items-center gap-2 ${themeTokens.text.secondary} font-semibold`}>
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Waiting
              </span>
              <span className="font-bold text-orange-500 dark:text-orange-400">{isMounted ? stats.onQueue : '--'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}