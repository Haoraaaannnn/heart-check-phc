import type { ReactNode } from 'react';
import { DASH } from '@/app/dashboard/constants/styles';

const S = DASH.card;

interface DashboardCardProps {
  /** Card heading. */
  title: string;
  /** Small description under the heading. */
  subtitle?: string;
  /** Boxicons class for the round icon badge (used with base `bx`), e.g. 'bxs-heart'. */
  icon?: string;
  /** Optional element aligned to the right of the header (filter, link, ...). */
  action?: ReactNode;
  /** Extra classes for the outer element (e.g. column spans). */
  className?: string;
  children: ReactNode;
}

/**
 * The shared wrapper for every panel on the dashboard: glass surface,
 * icon badge, title/subtitle header and an optional right-aligned action.
 * Styling lives in DASH.card (constants/styles.ts).
 */
export default function DashboardCard({
  title,
  subtitle,
  icon,
  action,
  className = '',
  children,
}: DashboardCardProps) {
  return (
    <section className={`${S.root} ${className}`.trim()}>
      <header className={S.header}>
        <div className={S.headerLeft}>
          {icon && (
            <span className={S.iconBadge}>
              <i className={`bx ${icon}`} />
            </span>
          )}
          <div>
            <h2 className={S.title}>{title}</h2>
            {subtitle && <p className={S.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>

      {children}
    </section>
  );
}