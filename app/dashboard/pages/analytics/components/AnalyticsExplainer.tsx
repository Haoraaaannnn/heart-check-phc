/**
 * @fileoverview Reusable plain-English explanation banner for the Analytics dashboard.
 *
 * Translates clinical queue analytics and statistical formulas into everyday language
 * with an optional expandable breakdown of how each metric or graph is computed.
 *
 * @module app/dashboard/pages/analytics/components/AnalyticsExplainer
 */

'use client';

import { useState } from 'react';
import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';

export interface ExplainerDetailItem {
  /** Short label describing the aspect (e.g., "What it computes", "How to read it"). */
  label: string;
  /** Plain-English explanation without technical math jargon. */
  text: string;
}

export interface AnalyticsExplainerProps {
  /** Short, always-visible plain-English summary of what the section shows. */
  summary: string;
  /** Optional expandable detail items explaining computation and interpretation. */
  details?: readonly ExplainerDetailItem[];
  /** Optional label for the summary prefix (defaults to "In plain terms"). */
  prefixLabel?: string;
  /** Whether details start expanded (defaults to false to keep layout compact). */
  defaultExpanded?: boolean;
}

/**
 * Displays a concise plain-English summary with an optional toggleable
 * "How it's computed" breakdown so non-technical users understand every chart and metric.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function AnalyticsExplainer({
  summary,
  details,
  prefixLabel = 'In plain terms:',
  defaultExpanded = false,
}: AnalyticsExplainerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const S = ANALYTICS_STYLES.explainer;
  const hasDetails = Boolean(details && details.length > 0);

  return (
    <div className={S.root}>
      <div className={S.topRow}>
        <p className={S.summaryText}>
          <span className={S.prefix}>{prefixLabel}</span> {summary}
        </p>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={S.toggleBtn}
            aria-expanded={expanded}
          >
            <i className={`bx ${expanded ? 'bx-chevron-up' : 'bx-help-circle'} text-sm`} />
            <span>{expanded ? 'Hide details' : 'How it works'}</span>
          </button>
        )}
      </div>

      {hasDetails && expanded && details && (
        <div className={S.detailsGrid}>
          {details.map((item) => (
            <div key={item.label} className={S.detailCard}>
              <span className={S.detailLabel}>{item.label}</span>
              <p className={S.detailText}>{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
