/**
 * @fileoverview Grid layout component for clinical cubicle examination rooms.
 *
 * @module app/dashboard/pages/cubicles/components/CubiclesGrid
 */

import DashboardCard from '@/app/dashboard/components/DashboardCard';
import CubicleCard from '@/app/dashboard/pages/cubicles/components/CubicleCard';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { Cubicle } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface CubiclesGridProps {
  /** Array of all cubicles. */
  cubicles: Cubicle[];
  /** Current live clock date. */
  currentTime: Date;
}

/**
 * Grid panel rendering all examination cubicle tiles.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function CubiclesGrid({ cubicles, currentTime }: CubiclesGridProps) {
  const T = CUBICLES_TEXTS.grid;

  return (
    <DashboardCard title={T.title} subtitle={T.subtitle} icon="bx-grid-alt">
      {cubicles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-base font-bold text-content">{T.emptyTitle}</p>
          <p className="mt-1 text-xs text-content-muted">{T.emptySubtitle}</p>
        </div>
      ) : (
        <div className={CUBICLES_STYLES.cubiclesGrid}>
          {cubicles.map((cubicle) => (
            <CubicleCard
              key={cubicle.id}
              cubicle={cubicle}
              currentTime={currentTime}
            />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
