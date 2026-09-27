import { getStatusGroup, STATUS_STYLES } from '@/constants/queueStatus';
import { DASH } from '@/app/dashboard/constants/styles';

const S = DASH.badge;

interface StatusBadgeProps {
  /** Raw `patients.status` value. */
  status: string;
}

/** Uppercases the first letter, e.g. "assigned" -> "Assigned". */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Colored status pill for a ticket.
 *
 * The raw status is mapped to a group (waiting, serving, done, ...) by
 * getStatusGroup(); label and colors come from STATUS_STYLES. Groups without a
 * fixed label (waiting, unknown) show the raw status text, so "Assigned" and
 * "Waiting" stay distinguishable.
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[getStatusGroup(status)];
  const label = style.label ?? capitalize(status);

  return (
    <span className={`${S.base} ${style.badge}`}>
      <span className={`${S.dot} ${style.dot}`} />
      {label}
    </span>
  );
}