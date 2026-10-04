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
      <p className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-widest mb-3">
        Algorithm Comparison
      </p>
      <div className={`${darkTheme} ${lightTheme} overflow-hidden`}>
        <table className="w-full text-xs">
          <thead className="font-bold uppercase text-[9px] text-slate-400 dark:text-[#737373]">
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
                  className={`border-t border-slate-200 dark:border-[#2e2e2e] ${
                    algo === bestAlgorithm ? "bg-[#a8071a]/5 dark:bg-[#a8071a]/15" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-slate-700 dark:text-[#f5f5f5] font-medium">
                    {algo}{algo === bestAlgorithm && " (Best)"}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500 dark:text-[#a3a3a3] font-mono">{m.MAE.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-slate-500 dark:text-[#a3a3a3] font-mono">{m.RMSE.toFixed(2)}</td>
                </tr>
              ))}
            {arimaAic !== null && (
              <tr className="border-t border-slate-200 dark:border-[#2e2e2e] bg-purple-50 dark:bg-purple-950/20">
                <td className="px-3 py-2 text-purple-700 dark:text-purple-300 font-semibold">ARIMA</td>
                <td className="px-3 py-2 text-right text-slate-500 dark:text-[#a3a3a3] font-mono">—</td>
                <td className="px-3 py-2 text-right text-purple-600 dark:text-purple-300 font-mono font-bold">
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