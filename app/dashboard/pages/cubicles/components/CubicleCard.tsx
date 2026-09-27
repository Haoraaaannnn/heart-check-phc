/**
 * @fileoverview Individual cubicle card component visualizing room status,
 * active patient assignment, service department, and consultation timer.
 *
 * @module app/dashboard/pages/cubicles/components/CubicleCard
 */

import {
  CUBICLES_STYLES,
  CUBICLE_STATUS_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { Cubicle } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface CubicleCardProps {
  /** The cubicle data model. */
  cubicle: Cubicle;
  /** Current live clock date to calculate remaining duration. */
  currentTime: Date;
}

/**
 * Renders an examination cubicle tile with status styling.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function CubicleCard({ cubicle, currentTime }: CubicleCardProps) {
  const S = CUBICLES_STYLES.cubicleCard;
  const T = CUBICLES_TEXTS.card;
  const statusStyle = CUBICLE_STATUS_STYLES[cubicle.status];

  const formatTime = (date?: Date) => {
    if (!date) return '—';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (endTime?: Date) => {
    if (!endTime) return null;
    const remaining = Math.max(0, endTime.getTime() - currentTime.getTime());
    const minutes = Math.floor(remaining / 60000);
    return minutes > 0 ? `${minutes}m` : T.lessThanMinute;
  };

  const timeRemaining = cubicle.status === 'occupied' ? getTimeRemaining(cubicle.estimatedEndTime) : null;

  return (
    <div className={`${S.tile} ${statusStyle.border} ${statusStyle.bg}`}>
      <div>
        <div className={S.headerRow}>
          <span className={S.number}>{cubicle.cubicleNum}</span>
          <span className={`${S.statusBadge} ${statusStyle.badgeBg} ${statusStyle.badgeText}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {cubicle.status}
          </span>
        </div>

        <p className={S.category}>{cubicle.category}</p>
      </div>

      <div className={`${S.body} mt-4`}>
        {cubicle.patientId && (
          <div className={S.detailRow}>
            <span>{T.patientPrefix}</span>
            <span className={S.detailValue}>{cubicle.patientId}</span>
          </div>
        )}

        {cubicle.service && (
          <div className={S.detailRow}>
            <span>{T.servicePrefix}</span>
            <span className={S.detailValue}>{cubicle.service}</span>
          </div>
        )}

        {cubicle.timeOccupied && (
          <div className={S.detailRow}>
            <span>{T.sincePrefix}</span>
            <span className={S.timeText}>{formatTime(cubicle.timeOccupied)}</span>
          </div>
        )}

        {cubicle.estimatedEndTime && timeRemaining && (
          <div className="mt-1 flex items-center justify-between">
            <span className={S.timeText}>
              {T.estEndPrefix} {formatTime(cubicle.estimatedEndTime)}
            </span>
            <span className={S.remainingPill}>
              <i className="bx bx-hourglass" />
              {timeRemaining}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
