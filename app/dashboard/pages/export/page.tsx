/**
 * @fileoverview Admin Dashboard Export Data canonical page (/dashboard/pages/export).
 *
 * Implements an independent enterprise workstation for generating and exporting
 * authoritative Philippine Heart Center Time and Motion Analysis Excel workbooks (.xlsx)
 * and patient queue datasets (.csv).
 *
 * Features:
 * 1. Real-time querying of verified dates containing patient records via {@link ExportDateBrowser}.
 * 2. Multi-mode date selection across single clinic days, calendar months, and rolling archives.
 * 3. Clinical department and serialization format controls via {@link ExportOptionsBar}.
 * 4. Comprehensive sheet specification, milestone architecture, and formula preview via {@link ExportPreviewCard}.
 * 5. Dataset KPI summary telemetry cards via {@link ExportTelemetryCards}.
 * 6. Session download tracking with instant re-download capabilities via {@link ExportHistoryList}.
 * 7. Official hospital documentation and formula calculation guidelines via {@link ExportFormatGuide}.
 *
 * @remarks
 * Conforms strictly to AGENTS.md rules: pure assembly and rendering, strict separation of concerns,
 * high-contrast solid surfaces, and zero emojis.
 *
 * @module app/dashboard/pages/export/page
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EXPORT_STYLES } from './constants/exportStyles';
import { useFileExport } from './hooks/useFileExport';
import ExportHeader from './components/ExportHeader';
import ExportTelemetryCards from './components/ExportTelemetryCards';
import ExportOptionsBar from './components/ExportOptionsBar';
import ExportDateBrowser from './components/ExportDateBrowser';
import ExportPreviewCard from './components/ExportPreviewCard';
import ExportHistoryList from './components/ExportHistoryList';
import ExportFormatGuide from './components/ExportFormatGuide';
import ExportResultsBanner from './components/ExportResultsBanner';

/**
 * Root page component for exporting patient queue datasets and workbooks.
 *
 * @returns Rendered JSX element.
 */
export default function ExportPage(): React.ReactElement {
  const router = useRouter();

  // Validate active session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
      }
    };
    checkSession();
  }, [router]);

  const {
    options,
    setOptions,
    availableDates,
    isLoadingDates,
    isExporting,
    error,
    history,
    lastExportResult,
    dismissResultBanner,
    dateSearchQuery,
    setDateSearchQuery,
    filteredDays,
    telemetry,
    refreshDates,
    triggerExport,
    reDownloadHistoryItem,
    clearHistory,
    canExport,
    targetPeriodLabel,
    predictedFilename,
  } = useFileExport();

  return (
    <div className={EXPORT_STYLES.page}>
      {/* Top Header Banner with Navigation and Polling Controls */}
      <ExportHeader
        isRefreshing={isLoadingDates}
        onRefresh={refreshDates}
      />

      {/* Completion Telemetry Banner */}
      <ExportResultsBanner
        result={lastExportResult}
        onDismiss={dismissResultBanner}
      />

      {/* Dataset KPI Summary Cards */}
      <ExportTelemetryCards
        telemetry={telemetry}
        isLoading={isLoadingDates}
      />

      {/* Export Configuration & Options Toolbar */}
      <ExportOptionsBar
        options={options}
        onOptionsChange={setOptions}
        disabled={isExporting}
      />

      {/* Interactive Calendar Date & Timeframe Browser */}
      <ExportDateBrowser
        options={options}
        onOptionsChange={setOptions}
        availableDates={availableDates}
        filteredDays={filteredDays}
        searchQuery={dateSearchQuery}
        onSearchChange={setDateSearchQuery}
        isLoading={isLoadingDates}
      />

      {/* Export Specification, Columns Architecture, and Action Trigger */}
      <ExportPreviewCard
        options={options}
        targetPeriodLabel={targetPeriodLabel}
        predictedFilename={predictedFilename}
        isExporting={isExporting}
        canExport={canExport}
        onExport={triggerExport}
        error={error}
      />

      {/* Session Downloads History Table */}
      <ExportHistoryList
        history={history}
        onRedownload={reDownloadHistoryItem}
        onClearHistory={clearHistory}
      />

      {/* Hospital Standards & Formula Guide */}
      <ExportFormatGuide />
    </div>
  );
}
