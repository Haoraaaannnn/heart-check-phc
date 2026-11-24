import DashboardCard from '@/app/dashboard/components/DashboardCard';
import DonutChart from '@/app/dashboard/components/DonutChart';
import type { DashboardStats } from '@/app/dashboard/hooks/useOverviewData';
import { SECTIONS, TICKET_BREAKDOWN_ROWS } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { STATUS_STYLES } from '@/constants/queueStatus';

const S = DASH.breakdown;
const C = SECTIONS.ticketStatus;

import { TicketBreakdownSkeleton } from '@/app/dashboard/components/skeletons/TicketBreakdownSkeleton';

interface TicketStatusBreakdownProps {
  stats: DashboardStats;
  isMounted: boolean;
  /** Flag indicating whether ticket breakdown query is actively loading */
  isLoading?: boolean;
}

/**
 * Donut + legend of today's tickets by status (served, serving, waiting, idle).
 * Rows and the donut's center metric are defined in
 * TICKET_BREAKDOWN_ROWS / SECTIONS.ticketStatus (constants/content.ts);
 * colors come from STATUS_STYLES so a status is always the same color
 * everywhere on the dashboard.
 */
export default function TicketStatusBreakdown({
  stats,
  isMounted,
  isLoading = false,
}: TicketStatusBreakdownProps) {
  if (isLoading) {
    return <TicketBreakdownSkeleton />;
  }
  const servedPercent =
    isMounted && stats.todayCount > 0 ? Math.round((stats.served / stats.todayCount) * 100) : 0;

  return (
    <DashboardCard
      title={C.title}
      subtitle={C.subtitle}
      icon={C.icon}
      className="h-full flex flex-col justify-between"
      action={
        isMounted && stats.todayCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-muted px-2.5 py-1 text-xs font-semibold text-content-muted whitespace-nowrap">
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {stats.served}
            </span>
            <span>of</span>
            <span className="font-mono font-bold text-content">{stats.todayCount}</span>
            <span>served</span>
          </span>
        ) : undefined
      }
    >
      <div className={S.split}>
        <DonutChart
          centerValue={isMounted ? `${servedPercent}%` : '--'}
          centerLabel={C.centerLabel}
          ariaLabel={`${servedPercent}% of today's tickets served`}
          segments={TICKET_BREAKDOWN_ROWS.map((row) => ({
            key: row.group,
            value: isMounted ? stats[row.statKey] : 0,
            color: STATUS_STYLES[row.group].hex,
          }))}
        />

        <div className={S.list}>
          <div className={S.rowsWrap}>
            {TICKET_BREAKDOWN_ROWS.map((row) => {
              const style = STATUS_STYLES[row.group];
              const rowCount = isMounted ? stats[row.statKey] : 0;
              const rowPct =
                isMounted && stats.todayCount > 0
                  ? Math.round((rowCount / stats.todayCount) * 100)
                  : 0;

              return (
                <div key={row.group} className={S.row}>
                  <span className={S.rowLabel}>
                    <span className={S.dot} style={{ backgroundColor: style.hex }} />
                    {row.label}
                  </span>
                  <div className={S.barTrack}>
                    <div
                      className={S.barFill}
                      style={{
                        width: `${Math.min(rowPct, 100)}%`,
                        backgroundColor: style.hex,
                      }}
                    />
                  </div>
                  <div className={S.countGroup}>
                    <span className={`${S.count} ${style.text}`}>
                      {isMounted ? rowCount : '--'}
                    </span>
                    <span className={S.percent}>
                      ({isMounted ? `${rowPct}%` : '--'})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {isMounted && stats.todayCount > 0 && (
            <div className={S.footerRow}>
              <span>Operational Yield:</span>
              <span className="font-mono font-bold text-content">
                {stats.served} out of {stats.todayCount} completed ({servedPercent}%)
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}