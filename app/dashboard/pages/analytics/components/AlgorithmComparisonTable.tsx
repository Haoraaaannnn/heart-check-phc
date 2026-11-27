/**
 * @fileoverview Algorithm Comparison Table component for forecasting evaluations.
 *
 * Compares Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and
 * Mean Absolute Scaled Error (MASE) across forecasting formulas, with plain-English
 * descriptions of each method and a metrics cheat sheet for non-technical users.
 *
 * @module app/dashboard/pages/analytics/components/AlgorithmComparisonTable
 */

'use client';

import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

export interface AlgorithmMetricEntry {
  MAE: number;
  RMSE: number;
  MASE?: number | null;
}

interface AlgorithmComparisonTableProps {
  /** Map of algorithm evaluations with MAE, RMSE, and optional MASE metrics. */
  evaluationMetrics?: Record<string, AlgorithmMetricEntry>;
  /** Name of the top-performing algorithm selected by the engine. */
  bestAlgorithm?: string;
  /** AIC value for the ARIMA model, if available. */
  arimaAic: number | null;
  /** Plain-language conclusion string returned by the forecasting engine. */
  algorithmicConclusion?: string;
}

/**
 * Comparative error table for algorithmic prediction models with plain-English
 * explanations for each formula and error metric.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function AlgorithmComparisonTable({
  evaluationMetrics,
  bestAlgorithm,
  arimaAic,
  algorithmicConclusion,
}: AlgorithmComparisonTableProps) {
  const S = ANALYTICS_STYLES.table;
  const G = ANALYTICS_STYLES.forecastGuide;
  const T = ANALYTICS_TEXTS.forecasts.comparison;

  const hasMase = Boolean(
    evaluationMetrics &&
      Object.values(evaluationMetrics).some(
        (m) => m && m.MASE !== undefined && m.MASE !== null
      )
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-content">
          {T.title}
        </span>
        <p className="text-xs leading-relaxed text-content-muted">
          {T.explainer}
        </p>
      </div>

      {algorithmicConclusion && (
        <div className="rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-xs text-content-muted leading-relaxed">
          <span className="font-bold text-content">{T.conclusionPrefix}</span>{' '}
          {algorithmicConclusion}
        </div>
      )}

      <div className={S.wrap}>
        <table className={S.table}>
          <thead>
            <tr className={S.headRow}>
              <th className={S.th}>{T.headers.algorithm}</th>
              <th className={`${S.th} text-right`}>{T.headers.mae}</th>
              <th className={`${S.th} text-right`}>{T.headers.rmse}</th>
              {hasMase && (
                <th className={`${S.th} text-right`}>{T.headers.mase}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {evaluationMetrics &&
              Object.entries(evaluationMetrics).map(([algo, m]) => {
                const isBest = algo === bestAlgorithm;
                const isBaseline = algo === 'Seasonal Naive';
                const algoDesc = T.algoDescriptions[algo];
                const maseVal = m?.MASE;

                return (
                  <tr
                    key={algo}
                    className={`${S.row} ${isBest ? 'bg-red-500/10' : ''}`}
                  >
                    <td className={`${S.td} min-w-[230px]`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-content ${isBest ? 'text-accent' : ''}`}>
                          {algo}
                        </span>
                        {isBest && (
                          <span className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 whitespace-nowrap">
                            {T.bestBadge}
                          </span>
                        )}
                        {isBaseline && (
                          <span className="inline-flex items-center rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-content-muted whitespace-nowrap">
                            {T.baselineBadge}
                          </span>
                        )}
                      </div>
                      {algoDesc && (
                        <p className="mt-0.5 text-xs text-content-subtle leading-snug">
                          {algoDesc}
                        </p>
                      )}
                    </td>
                    <td className={`${S.td} text-right font-mono font-semibold text-content whitespace-nowrap`}>
                      {typeof m?.MAE === 'number' ? m.MAE.toFixed(2) : '—'}
                    </td>
                    <td className={`${S.td} text-right font-mono text-content-muted whitespace-nowrap`}>
                      {typeof m?.RMSE === 'number' ? m.RMSE.toFixed(2) : '—'}
                    </td>
                    {hasMase && (
                      <td className={`${S.td} text-right whitespace-nowrap`}>
                        {typeof maseVal === 'number' ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-semibold text-content">
                              {maseVal.toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                maseVal < 1
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-content-subtle'
                              }`}
                            >
                              {isBaseline
                                ? 'Reference (1.00)'
                                : maseVal < 1
                                ? T.beatsBaseline
                                : T.matchesBaseline}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            {typeof arimaAic === 'number' && (
              <tr className={`${S.row} bg-purple-500/10 font-semibold`}>
                <td className={`${S.td} text-purple-700 dark:text-purple-300`}>
                  <span className="font-bold">{T.arimaLabel} (Overall Fit Score)</span>
                  <p className="mt-0.5 text-xs font-normal text-content-subtle">
                    Statistical fit score across the full range (separate scale from MAE/RMSE).
                  </p>
                </td>
                <td className={`${S.td} text-right font-mono text-content-muted`}>—</td>
                <td className={`${S.td} text-right font-mono font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap`}>
                  AIC: {arimaAic.toFixed(1)}
                </td>
                {hasMase && (
                  <td className={`${S.td} text-right font-mono text-content-muted`}>—</td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Metrics Cheat Sheet */}
      <div className={G.cheatSheetGrid}>
        {T.cheatSheet.map((item) => (
          <div key={item.term} className={G.cheatCard}>
            <span className={G.eyebrow}>{item.term}</span>
            <p className={G.explain}>{item.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
