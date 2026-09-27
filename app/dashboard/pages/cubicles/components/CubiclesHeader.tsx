/**
 * @fileoverview Header banner component for the Cubicles dashboard page.
 *
 * Displays the page title, real-time tracking subtitle, and current clock timestamp.
 *
 * @module app/dashboard/pages/cubicles/components/CubiclesHeader
 */

'use client';

import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';

interface CubiclesHeaderProps {
  /** The current live clock timestamp. */
  currentTime: Date;
}

/**
 * Top header banner for the Cubicles dashboard page.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function CubiclesHeader({ currentTime }: CubiclesHeaderProps) {
  const S = CUBICLES_STYLES.header;
  const T = CUBICLES_TEXTS.header;

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={S.root}>
      <div className={S.titleBlock}>
        <h1 className={S.title}>{T.title}</h1>
        <p className={S.subtitle}>{T.subtitle}</p>
      </div>

      <div className={S.timestamp}>
        <span>
          {T.lastUpdatedPrefix} <span className="font-mono font-bold text-content">{formattedTime}</span>
        </span>
      </div>
    </div>
  );
}
