/**
 * @fileoverview Main matrix table component for the Cubicles Heatmap section.
 *
 * Implements a 2D matrix visualizing examination units along the vertical axis and operational
 * hour slots along the horizontal axis, with sticky column pinning and responsive horizontal scrolling.
 *
 * @module app/dashboard/pages/cubicles/components/HeatmapTable
 */

'use client';

import {
  CUBICLES_STYLES,
  OPERATIONAL_HOURS,
  CUBICLE_STATUS_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type {
  HeatmapRowData,
  HeatmapHourlySummary,
  HeatmapCellData,
  HeatmapViewMode,
} from '@/app/dashboard/pages/cubicles/types/cubicle';
import HeatmapCell from '@/app/dashboard/pages/cubicles/components/HeatmapCell';

interface HeatmapTableProps {
  /** Array of cubicle rows with their calculated hourly analytical cells. */
  rows: HeatmapRowData[];
  /** Hourly summary totals aggregated across all examination rooms. */
  hourlySummaries: HeatmapHourlySummary[];
  /** Active perspective view mode. */
  viewMode: HeatmapViewMode;
  /** Callback invoked when a cell is clicked for detailed inspection. */
  onSelectCell: (cell: HeatmapCellData) => void;
  /** Whether the active date is today's real-time queue. */
  isLive: boolean;
}

/**
 * 2D Heatmap matrix component rendering cubicles versus operational hours.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function HeatmapTable({
  rows,
  hourlySummaries,
  viewMode,
  onSelectCell,
  isLive,
}: HeatmapTableProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap.table;

  const currentHourStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false,
  });
  const currentSlotPrefix = `${currentHourStr.padStart(2, '0')}:00`;

  return (
    <div className={S.tableWrap}>
      <table className={S.table}>
        <thead>
          <tr className={S.thRow}>
            {/* Sticky Cubicle Header */}
            <th className={S.thCubicle}>
              <div className="flex items-center gap-1.5">
                <i className="bx bx-door-open text-rose-500 text-sm" />
                <span>{T.cubicleCol}</span>
              </div>
            </th>

            {/* Operational Hourly Slots */}
            {OPERATIONAL_HOURS.map((hourStr) => {
              const [hNumStr] = hourStr.split(':');
              const hNum = parseInt(hNumStr, 10);
              const nextHour = `${String(hNum + 1).padStart(2, '0')}:00`;
              const isCurrent = isLive && hourStr === currentSlotPrefix;

              return (
                <th
                  key={hourStr}
                  className={`${S.thHour} ${isCurrent ? S.thHourCurrent : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-extrabold">{hourStr}</span>
                    <span className="text-[9px] font-medium opacity-70 tracking-normal">
                      {hourStr.slice(0, 2)}-{nextHour.slice(0, 2)}
                    </span>
                  </div>
                </th>
              );
            })}

            {/* Sticky Daily Summary Header */}
            <th className={S.thSummary}>
              <div className="flex items-center justify-center gap-1">
                <i className="bx bx-chart text-brand-accent text-sm" />
                <span>{T.summaryCol}</span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const statusStyle = CUBICLE_STATUS_STYLES[row.liveStatus];

            return (
              <tr key={row.cubicleId} className={S.tr}>
                {/* Sticky Cubicle Identity Cell */}
                <td className={S.tdCubicle}>
                  <div className="flex flex-col min-w-0">
                    <div className={S.cubicleNum}>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${statusStyle.dot}`} />
                      <span className="truncate">{row.cubicleNum}</span>
                    </div>

                    <span className={S.cubicleCategory}>{row.category}</span>

                    <span className={S.cubicleDoctor}>
                      <i className="bx bx-user-pin text-xs shrink-0" />
                      <span className="truncate">
                        {row.assignedDoctor
                          ? `${T.assignedDoctorPrefix} ${row.assignedDoctor}`
                          : T.unassignedDoctor}
                      </span>
                    </span>
                  </div>
                </td>

                {/* Hourly Slots for this Cubicle */}
                {OPERATIONAL_HOURS.map((hourStr) => {
                  const cell = row.cells[hourStr];
                  return (
                    <td key={hourStr} className={S.tdCell}>
                      {cell && (
                        <HeatmapCell
                          cell={cell}
                          viewMode={viewMode}
                          onClick={() => onSelectCell(cell)}
                        />
                      )}
                    </td>
                  );
                })}

                {/* Sticky Daily Cubicle Summary */}
                <td className={S.tdSummary}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-mono text-xs font-extrabold text-content">
                      {row.dailyTotalPatients} {row.dailyTotalPatients === 1 ? T.ptUnit : T.ptsUnit}
                    </span>

                    <div className="flex items-center gap-1 text-[10px] text-content-muted">
                      <span>{T.avgSpeedPrefix}</span>
                      <span className="font-mono font-bold text-content">
                        {row.dailyAvgSpeedMinutes > 0 ? `${row.dailyAvgSpeedMinutes}m` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-content-muted">
                      <span>{T.utilizationPrefix}</span>
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {row.dailyOccupancyPercent}%
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className={S.tfRow}>
            {/* Sticky Hourly Total Label */}
            <td className={S.tfCubicle}>
              <div className="flex items-center gap-1.5">
                <i className="bx bx-bar-chart-alt-2 text-rose-500 text-sm" />
                <span>{T.hourlyTotalRow}</span>
              </div>
            </td>

            {/* Hourly Aggregates across all Cubicles */}
            {hourlySummaries.map((summary) => (
              <td key={summary.hour} className={S.tfHour}>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs font-extrabold text-content">
                    {summary.totalPatients} {summary.totalPatients === 1 ? T.ptUnit : T.ptsUnit}
                  </span>

                  {viewMode === 'speed' && (
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                      {summary.avgSpeedMinutes > 0 ? `${summary.avgSpeedMinutes}m avg` : '—'}
                    </span>
                  )}

                  {viewMode === 'idle' && (
                    <span className="font-mono text-[10px] text-indigo-700 dark:text-indigo-300">
                      {summary.avgIdleMinutes > 0 ? `${summary.avgIdleMinutes}m idle` : '—'}
                    </span>
                  )}

                  {viewMode === 'dual' && (
                    <span className="font-mono text-[10px] text-content-muted">
                      {summary.avgOccupancyPercent}% util
                    </span>
                  )}
                </div>
              </td>
            ))}

            {/* Footer Corner Total Cell */}
            <td className={S.tfSummary}>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-content-muted uppercase">
                  Facility Total
                </span>
                <span className="font-mono text-xs font-extrabold text-brand-accent">
                  {rows.reduce((acc, r) => acc + r.dailyTotalPatients, 0)} {T.ptsUnit}
                </span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
