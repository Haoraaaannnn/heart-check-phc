"use client";

import { darkTheme, lightTheme } from "@/constants/themes";

interface Props {
  evaluationMetrics: Record<string, { MAE: number; RMSE: number }>;
  bestAlgorithm: string;
  arimaAic: number | null;
}

export default function AlgorithmComparisonTable({
  evaluationMetrics,
  bestAlgorithm,
  arimaAic,
}: Props) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Algorithm Comparison
      </p>
      <div className={`${darkTheme} ${lightTheme} overflow-hidden`}>
        <table className="w-full text-xs">
          <thead className="font-bold uppercase text-[9px] text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Algorithm</th>
              <th className="px-3 py-2 text-right">MAE</th>
              <th className="px-3 py-2 text-right">RMSE</th>
            </tr>
          </thead>
          <tbody>
            {evaluationMetrics &&
              Object.entries(evaluationMetrics).map(([algo, m]: any) => (
                <tr
                  key={algo}
                  className={`border-t border-gray-100 dark:border-gray-700 ${
                    algo === bestAlgorithm ? "bg-red-50 dark:bg-red-900/20" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {algo}{algo === bestAlgorithm && " ✓"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 font-mono">{m.MAE.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-gray-500 font-mono">{m.RMSE.toFixed(2)}</td>
                </tr>
              ))}
            {arimaAic !== null && (
              <tr className="border-t border-gray-100 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                <td className="px-3 py-2 text-purple-700 dark:text-purple-400 font-semibold">ARIMA</td>
                <td className="px-3 py-2 text-right text-gray-500 font-mono">—</td>
                <td className="px-3 py-2 text-right text-purple-600 dark:text-purple-400 font-mono font-bold">
                  AIC: {arimaAic?.toFixed(1)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}