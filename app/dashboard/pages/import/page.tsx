/**
 * @fileoverview Admin Dashboard Import Data canonical page (/dashboard/pages/import).
 *
 * Implements a graphical drag-and-drop ingestion interface for PHC Time and Motion
 * workbooks (.xls, .xlsx) and patient queue CSV files (.csv).
 *
 * Features:
 * 1. Interactive file drag-and-drop dropzone with visual hit testing.
 * 2. In-memory schema inspection and preview dialog before committing.
 * 3. Configurable clinical department and historical research immutability tagging.
 * 4. Resilient chunked batch insertion into Supabase with automatic cache invalidation.
 * 5. Comprehensive post-import telemetry banner with deep-linking to Patients and Analytics.
 *
 * @remarks
 * Conforms strictly to AGENTS.md enterprise navigation, solid surfaces, separation of concerns,
 * and zero emojis standards.
 *
 * @module app/dashboard/pages/import/page
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { useFileImport } from '@/app/dashboard/pages/import/hooks/useFileImport';
import ImportHeader from '@/app/dashboard/pages/import/components/ImportHeader';
import FileDropzone from '@/app/dashboard/pages/import/components/FileDropzone';
import ImportOptionsBar from '@/app/dashboard/pages/import/components/ImportOptionsBar';
import StagedFileList from '@/app/dashboard/pages/import/components/StagedFileList';
import FilePreviewModal from '@/app/dashboard/pages/import/components/FilePreviewModal';
import ImportResultsBanner from '@/app/dashboard/pages/import/components/ImportResultsBanner';
import ImportFormatGuide from '@/app/dashboard/pages/import/components/ImportFormatGuide';

/**
 * Root page component for importing patient datasets into the system.
 *
 * @returns Rendered JSX element.
 */
export default function ImportPage(): React.ReactElement {
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
    files,
    options,
    activePreviewFile,
    isDragging,
    isProcessingAll,
    aggregatedSummary,
    setOptions,
    stageFiles,
    removeFile,
    clearAllFiles,
    inspectFile,
    commitSingleFile,
    commitAllFiles,
    closePreview,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useFileImport();

  return (
    <div className={IMPORT_STYLES.page}>
      {/* Top Header */}
      <ImportHeader />

      {/* Completion Telemetry Banner */}
      <ImportResultsBanner
        summary={aggregatedSummary}
        onDismiss={clearAllFiles}
      />

      {/* Drag & Drop Upload Zone */}
      <FileDropzone
        isDragging={isDragging}
        onFilesSelected={stageFiles}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {/* Ingestion Configuration Options */}
      <ImportOptionsBar
        options={options}
        onOptionsChange={setOptions}
        disabled={isProcessingAll}
      />

      {/* Staged Files Queue Table */}
      <StagedFileList
        files={files}
        isProcessingAll={isProcessingAll}
        onInspect={inspectFile}
        onImportSingle={commitSingleFile}
        onImportAll={commitAllFiles}
        onRemove={removeFile}
        onClearAll={clearAllFiles}
      />

      {/* File Format & Schema Documentation Guide */}
      <ImportFormatGuide />

      {/* Inspection Preview Modal */}
      <FilePreviewModal
        file={activePreviewFile}
        onClose={closePreview}
        onConfirm={commitSingleFile}
      />
    </div>
  );
}
