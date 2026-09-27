import Link from 'next/link';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { QUICK_LINKS, SECTIONS } from '@/app/dashboard/constants/content';
import { DASH, TONES } from '@/app/dashboard/constants/styles';

const S = DASH.quickLink;
const C = SECTIONS.quickLinks;

/**
 * Shortcut tiles to other parts of the app.
 * The dashboard is informational only (admin, not superadmin - no queue
 * actions happen here), so these are plain links, not action buttons.
 * Edit QUICK_LINKS in constants/content.ts to change what's offered.
 */
export default function QuickLinks() {
  return (
    <DashboardCard title={C.title} subtitle={C.subtitle} icon={C.icon}>
      <div className={S.grid}>
        {QUICK_LINKS.map((link) => {
          const tone = TONES[link.tone];
          return (
            <Link key={link.href} href={link.href} className={`${S.tile} ${tone.tile}`}>
              <span className={`${S.icon} ${tone.icon}`}>
                <i className={`bx ${link.icon}`} />
              </span>
              {link.label}
              <i className={`bx bx-chevron-right ${S.arrow}`} />
            </Link>
          );
        })}
      </div>
    </DashboardCard>
  );
}