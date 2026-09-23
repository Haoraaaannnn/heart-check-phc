import DashboardCard from '@/app/dashboard/components/DashboardCard';
import DonutChart from '@/app/dashboard/components/DonutChart';
import type { DashboardStats } from '@/app/dashboard/hooks/useOverviewData';
import { SECTIONS, TICKET_BREAKDOWN_ROWS } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { STATUS_STYLES } from '@/constants/queueStatus';

const S = DASH.breakdown;
const C = SECTIONS.ticketStatus;

interface TicketStatusBreakdownProps {
  stats: DashboardStats;
  isMounted: boolean;
}

/**
 * Donut + legend of today's tickets by status (served, serving, waiting, idle).
 * Rows and the donut's center metric are defined in
 * TICKET_BREAKDOWN_ROWS / SECTIONS.ticketStatus (constants/content.ts);
 * colors come from STATUS_STYLES so a status is always the same color
 * everywhere on the dashboard.
 */
export default function TicketStatusBreakdown({ stats, isMounted }: TicketStatusBreakdownProps) {
  const servedPercent =
    isMounted && stats.todayCount > 0 ? Math.round((stats.served / stats.todayCount) * 100) : 0;

  return (
    <DashboardCard title={C.title} subtitle={C.subtitle} icon={C.icon}>
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
          {TICKET_BREAKDOWN_ROWS.map((row) => {
            const style = STATUS_STYLES[row.group];
            return (
              <div key={row.group} className={S.row}>
                <span className={S.rowLabel}>
                  <span className={S.dot} style={{ backgroundColor: style.hex }} />
                  {row.label}
                </span>
                <span className={`${S.count} ${style.text}`}>
                  {isMounted ? stats[row.statKey] : '--'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardCard>
  );
}