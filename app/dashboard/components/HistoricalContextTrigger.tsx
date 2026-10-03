/**
 * @fileoverview Compact trigger bar for expanding the historical data breakdown on demand.
 *
 * Appears on the overview page when live patient activity exists, allowing administrators
 * to inspect longitudinal performance metrics and monthly throughput without leaving the page.
 *
 * @remarks
 * Conforms to AGENTS.md: pure assembly and rendering, strict separation of concerns,
 * high-contrast solid surfaces, and zero emojis.
 *
 * @module app/dashboard/components/HistoricalContextTrigger
 */

'use client';

import { HISTORICAL_STYLES } from '@/app/dashboard/constants/historicalStyles';
import { HISTORICAL_TEXTS } from '@/app/dashboard/constants/historicalTexts';

/**
 * Properties for the {@link HistoricalContextTrigger} component.
 */
export interface HistoricalContextTriggerProps {
  /** Callback fired when the administrator clicks to expand the historical breakdown */
  onOpen: () => void;
}

/**
 * Compact bar prompting administrators to inspect archive baseline metrics.
 *
 * @param props - Component properties.
 * @returns Rendered JSX element.
 */
export default function HistoricalContextTrigger({ onOpen }: HistoricalContextTriggerProps) {
  const S = HISTORICAL_STYLES.triggerBar;
  const T = HISTORICAL_TEXTS.header;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={S.root}
      aria-label={T.expandButton}
    >
      <div className={S.left}>
        <div className={S.iconBadge}>
          <i className="bx bx-history" />
        </div>
        <div className={S.titleWrap}>
          <p className={S.title}>{T.titleOnDemand}</p>
          <p className={S.subtitle}>{T.expandSubtitle}</p>
        </div>
      </div>

      <button type="button" onClick={onOpen} className={S.toggleBtn} tabIndex={-1}>
        <span>{T.expandButton}</span>
        <i className="bx bx-chevron-down text-base" />
      </button>
    </div>
  );
}
