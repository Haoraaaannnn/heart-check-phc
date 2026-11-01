import DashboardCard from '@/app/dashboard/components/DashboardCard';
import DonutChart from '@/app/dashboard/components/DonutChart';
import { SECTIONS, SERVICE_OVERVIEW } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getServiceColor } from '@/constants/palette';

const S = DASH.breakdown;
const C = SECTIONS.serviceQueue;

import { ServiceQueueSkeleton } from '@/app/dashboard/components/skeletons/ServiceQueueSkeleton';

interface ServiceQueueOverviewProps {
  /** Service name -> patients currently waiting or being served. */
  deptStats: Record<string, number>;
  isMounted: boolean;
  /** Flag indicating whether department query is actively loading */
  isLoading?: boolean;
}

/**
 * Donut + legend of patients currently in queue, broken down by service.
 * Colors per service come from constants/palette.ts, shared with any other
 * chart that needs the same service -> color mapping.
 */
export default function ServiceQueueOverview({
  deptStats,
  isMounted,
  isLoading = false,
}: ServiceQueueOverviewProps) {
  if (isLoading) {
    return <ServiceQueueSkeleton />;
  }
  const entries = isMounted ? Object.entries(deptStats) : [];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <DashboardCard
      title={C.title}
      subtitle={C.subtitle}
      icon={C.icon}
      action={
        isMounted && total > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-muted px-2.5 py-1 text-xs font-semibold text-content-muted whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-content">{total}</span> active in queue
          </span>
        ) : undefined
      }
    >
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
              const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={service} className={S.row}>
                  <span className="flex min-w-[120px] flex-1 items-center gap-2 font-semibold text-content-muted whitespace-nowrap">
                    <span className={S.dot} style={{ backgroundColor: color }} />
                    {service}
                  </span>
                  <div className={S.barTrack}>
                    <div className={S.barFill} style={{ width: barWidth, backgroundColor: color }} />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[70px]">
                    <span className={S.count}>{count}</span>
                    <span className="text-[11px] font-mono font-semibold text-content-muted tabular-nums">
                      ({sharePct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}