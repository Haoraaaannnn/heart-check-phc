import DashboardCard from '@/app/dashboard/components/DashboardCard';
import type { PatientRecord } from '@/app/dashboard/hooks/useOverviewData';
import {
  ACTIVITY_MESSAGE_OVERRIDES,
  ACTIVITY_MESSAGES,
  SECTIONS,
} from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';
import { getStatusGroup, STATUS_STYLES } from '@/constants/queueStatus';
import { formatManilaTime } from '@/utils/formatDateTime';

const S = DASH.activity;
const C = SECTIONS.recentActivity;

interface RecentActivityProps {
  patients: PatientRecord[];
  isMounted: boolean;
}

/**
 * Recent ticket updates, most-recently-updated first.
 *
 * CAVEAT: `patients` has no event log - only the row's current state and
 * `updated_at`. So this shows each ticket's latest status change, not a full
 * history. A ticket that changed status twice only appears once, at its most
 * recent state.
 */
export default function RecentActivity({ patients, isMounted }: RecentActivityProps) {
  const items = [...patients]
    .filter((p) => p.updated_at)
    .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
    .slice(0, C.limit);

  return (
    <DashboardCard title={C.title} subtitle={C.subtitle} icon={C.icon}>
      {isMounted && items.length === 0 && <p className={DASH.card.empty}>{C.emptyText}</p>}

      {isMounted && items.length > 0 && (
        <ul className={S.list}>
          {items.map((patient) => {
            const group = getStatusGroup(patient.status);
            const normalizedStatus = (patient.status ?? '').toLowerCase().trim();
            const message = ACTIVITY_MESSAGE_OVERRIDES[normalizedStatus] ?? ACTIVITY_MESSAGES[group];

            return (
              <li key={patient.id} className={S.item}>
                <span className={S.dot} style={{ backgroundColor: STATUS_STYLES[group].hex }} />
                <p className={S.text}>
                  <span className={S.strong}>Ticket {patient.patientNum || patient.id}</span>{' '}
                  {message}
                </p>
                <span className={S.time}>{formatManilaTime(new Date(patient.updated_at!))}</span>
              </li>
            );
          })}
        </ul>
      )}

      <a href={C.viewAllHref} className={DASH.card.footerLink}>
        {C.viewAllLabel}
        <i className="bx bx-right-arrow-alt" />
      </a>
    </DashboardCard>
  );
}