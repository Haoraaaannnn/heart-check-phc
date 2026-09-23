import DashboardCard from '@/app/dashboard/components/DashboardCard';
import DonutChart from '@/app/dashboard/components/DonutChart';
import { SECTIONS, SERVICE_OVERVIEW } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getServiceColor } from '@/constants/palette';

const S = DASH.breakdown;
const C = SECTIONS.serviceQueue;

interface ServiceQueueOverviewProps {
  /** Service name -> patients currently waiting or being served. */
  deptStats: Record<string, number>;
  isMounted: boolean;
}

/**
 * Donut + legend of patients currently in queue, broken down by service.
 * Colors per service come from constants/palette.ts, shared with any other
 * chart that needs the same service -> color mapping.
 */
export default function ServiceQueueOverview({ deptStats, isMounted }: ServiceQueueOverviewProps) {
  const entries = isMounted ? Object.entries(deptStats) : [];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <DashboardCard title={C.title} subtitle={C.subtitle} icon={C.icon}>
      {entries.length === 0 ? (
        <p className={DASH.card.empty}>{SERVICE_OVERVIEW.emptyText}</p>
      ) : (
        <div className={S.split}>
          <DonutChart
            centerValue={total}
            centerLabel={C.centerLabel}
            ariaLabel={`${total} patients in queue across ${entries.length} services`}
            segments={entries.map(([service, count], index) => ({
              key: service,
              value: count,
              color: getServiceColor(service, index),
            }))}
          />

          <div className={S.list}>
            {entries.map(([service, count], index) => {
              const color = getServiceColor(service, index);
              const barWidth = `${Math.min((count / maxCount) * 100, 100)}%`;

              return (
                <div key={service} className={S.row}>
                  <span className={S.rowLabel}>
                    <span className={S.dot} style={{ backgroundColor: color }} />
                    {service}
                  </span>
                  <div className={S.barTrack}>
                    <div className={S.barFill} style={{ width: barWidth, backgroundColor: color }} />
                  </div>
                  <span className={S.count}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}