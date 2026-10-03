/**
 * @fileoverview Main orchestrating section component for the Cubicle Operational Heatmap.
 *
 * Integrates the header controls, summary KPI metrics, matrix table, visual legend,
 * and consultation detail inspection modal into a cohesive enterprise DashboardCard.
 *
 * @module app/dashboard/pages/cubicles/components/CubicleHeatmapSection
 */

'use client';

import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import { useCubicleHeatmapData } from '@/app/dashboard/pages/cubicles/hooks/useCubicleHeatmapData';
import HeatmapHeaderControls from '@/app/dashboard/pages/cubicles/components/HeatmapHeaderControls';
import HeatmapKpiGrid from '@/app/dashboard/pages/cubicles/components/HeatmapKpiGrid';
import HeatmapTable from '@/app/dashboard/pages/cubicles/components/HeatmapTable';
import HeatmapLegend from '@/app/dashboard/pages/cubicles/components/HeatmapLegend';
import HeatmapDetailModal from '@/app/dashboard/pages/cubicles/components/HeatmapDetailModal';

/**
 * Visual heatmap section displaying cubicle processing speed and idle downtime.
 *
 * @returns JSX element.
 */
export default function CubicleHeatmapSection() {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap;

  const {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    availableDates,
    selectedCell,
    setSelectedCell,
    rows,
    hourlySummaries,
    kpis,
    loading,
    error,
    isLive,
    refresh,
  } = useCubicleHeatmapData();

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-tachometer"
      className="w-full"
    >
      <div className={S.container}>
        {/* Top Controls Toolbar */}
        <HeatmapHeaderControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          availableDates={availableDates}
          isLive={isLive}
          onRefresh={refresh}
          isLoading={loading}
        />

        {/* Loading State */}
        {loading && rows.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-xl border border-line bg-surface-subtle text-center text-sm font-semibold text-content-muted">
            <div className="flex flex-col items-center gap-2.5">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
              <p>Analyzing cubicle processing speeds and idle intervals</p>
            </div>
          </div>
        ) : error && rows.length === 0 ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : (
          <>
            {/* Summary KPI Grid */}
            <HeatmapKpiGrid kpis={kpis} />

            {/* Zero Patients Guidance Banner when selecting an inactive day */}
            {kpis.totalPatientsServed === 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <i className="bx bx-info-circle text-lg text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold text-amber-800 dark:text-amber-200">
                      {T.empty.title}
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      {T.empty.subtitle} {T.empty.selectAnotherDate}
                    </p>
                  </div>
                </div>

                {availableDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Switch to first date with records that is not the currently empty date
                      const alternateDate = availableDates.find((d) => d !== selectedDate);
                      if (alternateDate) setSelectedDate(alternateDate);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer shrink-0"
                  >
                    <i className="bx bx-history" />
                    <span>View Recorded Day</span>
                  </button>
                )}
              </div>
            )}

            {/* 2D Heatmap Matrix Table */}
            <HeatmapTable
              rows={rows}
              hourlySummaries={hourlySummaries}
              viewMode={viewMode}
              onSelectCell={setSelectedCell}
              isLive={isLive}
            />

            {/* Heatmap Interpretation Legend */}
            <HeatmapLegend viewMode={viewMode} />
          </>
        )}

        {/* Granular Inspection Modal */}
        <HeatmapDetailModal
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      </div>
    </DashboardCard>
  );
}
