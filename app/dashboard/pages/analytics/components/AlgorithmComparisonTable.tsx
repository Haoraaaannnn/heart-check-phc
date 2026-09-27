/**
 * @fileoverview Algorithm Comparison Table component for forecasting evaluations.
 *
 * Compares Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) across algorithms
 * (Linear Regression, Moving Averages, Exponential Smoothing, ARIMA) and highlights the best performing model.
 *
 * @module app/dashboard/pages/analytics/components/AlgorithmComparisonTable
 */

'use client';

import { ANALYTICS_STYLES } from '@/app/dashboard/pages/analytics/constants/analytics';
import { ANALYTICS_TEXTS } from '@/app/dashboard/pages/analytics/constants/analyticsTexts';

interface AlgorithmComparisonTableProps {
  /** Map of algorithm evaluations with MAE and RMSE metrics. */
  evaluationMetrics: Record<string, { MAE: number; RMSE: number }>;
  /** Name of the top-performing algorithm selected by the engine. */
  bestAlgorithm: string;
  /** AIC value for the ARIMA model, if available. */
  arimaAic: number | null;
}

/**
 * Comparative error table for algorithmic prediction models.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function AlgorithmComparisonTable({
  evaluationMetrics,
  bestAlgorithm,
  arimaAic,
}: AlgorithmComparisonTableProps) {
  const S = ANALYTICS_STYLES.table;
  const T = ANALYTICS_TEXTS.forecasts.comparison;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
        {T.title}
      </span>
      <div className={S.wrap}>
        <table className={S.table}>
          <thead>
            <tr className={S.headRow}>
              <th className={S.th}>{T.headers.algorithm}</th>
              <th className={`${S.th} text-right`}>{T.headers.mae}</th>
              <th className={`${S.th} text-right`}>{T.headers.rmse}</th>
            </tr>
          </thead>
          <tbody>
            {evaluationMetrics &&
              Object.entries(evaluationMetrics).map(([algo, m]: [string, any]) => {
                const isBest = algo === bestAlgorithm;

                return (
                  <tr
                    key={algo}
                    className={`${S.row} ${isBest ? 'bg-red-500/10 font-bold' : ''}`}
                  >
                    <td className={`${S.td} text-content`}>
                      {algo}
                      {isBest && (
                        <span className="ml-1.5 text-xs text-brand-accent">
                          {T.bestIndicator}
                        </span>
                      )}
                    </td>
                    <td className={`${S.td} text-right font-mono text-content-muted`}>
                      {typeof m?.MAE === 'number' ? m.MAE.toFixed(2) : '—'}
                    </td>
                    <td className={`${S.td} text-right font-mono text-content-muted`}>
                      {typeof m?.RMSE === 'number' ? m.RMSE.toFixed(2) : '—'}
                    </td>
                  </tr>
                );
              })}
            {typeof arimaAic === 'number' && (
              <tr className={`${S.row} bg-purple-500/10 font-semibold`}>
                <td className={`${S.td} text-purple-600 dark:text-purple-400`}>
                  {T.arimaLabel}
                </td>
                <td className={`${S.td} text-right font-mono text-content-muted`}>—</td>
                <td className={`${S.td} text-right font-mono font-bold text-purple-600 dark:text-purple-400`}>
                  AIC: {arimaAic.toFixed(1)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
