/**
 * @fileoverview Status legend component for clinical cubicle examination rooms.
 *
 * @module app/dashboard/pages/cubicles/components/CubiclesLegend
 */

import DashboardCard from '@/app/dashboard/components/DashboardCard';
import {
  CUBICLES_STYLES,
  CUBICLE_STATUS_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';

/**
 * Operational status key reference panel for examination rooms.
 *
 * @returns JSX element.
 */
export default function CubiclesLegend() {
  const S = CUBICLES_STYLES.legend;
  const T = CUBICLES_TEXTS.legend;

  const items = [
    { label: T.available, style: CUBICLE_STATUS_STYLES.available },
    { label: T.occupied, style: CUBICLE_STATUS_STYLES.occupied },
    { label: T.maintenance, style: CUBICLE_STATUS_STYLES.maintenance },
    { label: T.cleaning, style: CUBICLE_STATUS_STYLES.cleaning },
  ];

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-info-circle">
      <div className={S.container}>
        {items.map((item) => (
          <div key={item.label} className={S.item}>
            <span className={`${S.dot} ${item.style.dot}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
