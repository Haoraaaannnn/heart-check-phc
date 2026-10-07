/**
 * @fileoverview Custom React hook managing file staging, drag-and-drop interactions,
 * inspection previews, and Supabase database ingestion requests.
 *
 * Provides safe binary payload transfers to the FastAPI backend, resilient
 * AbortController timeout handling, and aggregated completion telemetry.
 *
 * @module app/dashboard/pages/import/hooks/useFileImport
 */

'use client';

import { useState, useCallback } from 'react';
import {
  ACCEPTED_FILE_EXTENSIONS,
  DEFAULT_BATCH_SIZE,
  DEFAULT_IS_HISTORICAL,
  DEFAULT_SERVICE,
  MAX_FILE_SIZE_BYTES,
} from '@/app/dashboard/pages/import/constants/import';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';
import {
  ImportApiResponse,
  ImportOptions,
  StagedFile,
} from '@/app/dashboard/pages/import/types/importTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Hook return contract for managing the file import workflow.
 */
export interface UseFileImportReturn {
  /** Array of currently staged files. */
  files: StagedFile[];
  /** Ingestion configuration settings. */
  options: ImportOptions;
  /** File currently being displayed inside the inspection preview dialog. */
  activePreviewFile: StagedFile | null;
  /** Whether the drag-and-drop hover state is active over the dropzone. */
  isDragging: boolean;
  /** Whether batch processing of all files is actively underway. */
  isProcessingAll: boolean;
  /** Latest aggregated ingestion result summary across finished files. */
  aggregatedSummary: {
    totalFiles: number;
    successfulFiles: number;
    totalInserted: number;
    totalDropped: number;
    dateRange: { start: string | null; end: string | null };
  } | null;
  /** Updates ingestion configuration options. */
  setOptions: React.Dispatch<React.SetStateAction<ImportOptions>>;
  /** Stages one or more native File objects with client-side validation. */
  stageFiles: (rawFiles: FileList | File[]) => void;
  /** Removes a staged file by its client ID. */
  removeFile: (id: string) => void;
  /** Clears all currently staged files and resets summary. */
  clearAllFiles: () => void;
  /** Triggers a dry-run server inspection for schema preview without inserting. */
  inspectFile: (id: string) => Promise<void>;
  /** Ingests an individual file into the database. */
  commitSingleFile: (id: string) => Promise<void>;
  /** Ingests all pending staged files sequentially into the database. */
  commitAllFiles: () => Promise<void>;
  /** Closes the active inspection preview dialog. */
  closePreview: () => void;
  /** Pointer drag enter/over handler. */
  handleDragEnter: (e: React.DragEvent) => void;
  /** Pointer drag leave handler. */
  handleDragLeave: (e: React.DragEvent) => void;
  /** Pointer drop handler. */
  handleDrop: (e: React.DragEvent) => void;
}

/**
 * Custom hook providing reactive state and operations for importing files.
 *
 * @returns State and dispatcher functions.
 */
export function useFileImport(): UseFileImportReturn {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [options, setOptions] = useState<ImportOptions>({
    service: DEFAULT_SERVICE,
    isHistorical: DEFAULT_IS_HISTORICAL,
    batchSize: DEFAULT_BATCH_SIZE,
  });
  const [activePreviewFile, setActivePreviewFile] = useState<StagedFile | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [aggregatedSummary, setAggregatedSummary] = useState<UseFileImportReturn['aggregatedSummary']>(null);

  /**
   * Validates and stages an array or FileList of files.
   */
  const stageFiles = useCallback((rawFiles: FileList | File[]) => {
    const list = Array.from(rawFiles);
    const newStaged: StagedFile[] = [];

    for (const file of list) {
      const lower = file.name.toLowerCase();
      const extMatch = ACCEPTED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));

      if (!extMatch) {
        newStaged.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          extension: file.name.split('.').pop() || '',
          status: 'error',
          errorMessage: IMPORT_TEXTS.errors.unsupportedExtension,
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        newStaged.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          extension: file.name.split('.').pop() || '',
          status: 'error',
          errorMessage: IMPORT_TEXTS.errors.fileTooLarge,
        });
        continue;
      }

      newStaged.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        extension: file.name.split('.').pop() || '',
        status: 'pending',
      });
    }

    setFiles((prev) => [...prev, ...newStaged]);
  }, []);

  /**
   * Removes a file from the staging queue.
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setActivePreviewFile((current) => (current?.id === id ? null : current));
  }, []);

  /**
   * Clears the entire staging queue.
   */
  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setActivePreviewFile(null);
    setAggregatedSummary(null);
  }, []);

  /**
   * Performs an in-memory inspection request on the server to extract sample records.
   */
  const inspectFile = useCallback(
    async (id: string) => {
      const target = files.find((f) => f.id === id);
      if (!target) return;

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'inspecting', errorMessage: undefined } : f))
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      try {
        const buffer = await target.file.arrayBuffer();
        const qs = new URLSearchParams({
          filename: target.name,
          mode: 'inspect',
          service: options.service,
          is_historical: String(options.isHistorical),
          batch_size: String(options.batchSize),
        });

        const res = await fetch(`${API_BASE}/api/import-file?${qs.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const message = errorData?.detail || `${IMPORT_TEXTS.errors.serverErrorPrefix}${res.statusText}`;
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: 'error', errorMessage: message } : f))
          );
          return;
        }

        const data: ImportApiResponse = await res.json();
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: 'readyToCommit', previewData: data, errorMessage: undefined } : f
          )
        );
        setActivePreviewFile({
          ...target,
          status: 'readyToCommit',
          previewData: data,
        });
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errMessage =
          err instanceof Error && err.name === 'AbortError'
            ? 'Inspection timed out after 60 seconds.'
            : IMPORT_TEXTS.errors.genericError;
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: 'error', errorMessage: errMessage } : f))
        );
      }
    },
    [files, options]
  );

  /**
   * Ingests a single staged file into the database.
   */
  const commitSingleFile = useCallback(
    async (id: string) => {
      const target = files.find((f) => f.id === id);
      if (!target) return;

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'importing', errorMessage: undefined } : f))
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);

      try {
        const buffer = await target.file.arrayBuffer();
        const qs = new URLSearchParams({
          filename: target.name,
          mode: 'commit',
          service: options.service,
          is_historical: String(options.isHistorical),
          batch_size: String(options.batchSize),
        });

        const res = await fetch(`${API_BASE}/api/import-file?${qs.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const message = errorData?.detail || `${IMPORT_TEXTS.errors.serverErrorPrefix}${res.statusText}`;
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: 'error', errorMessage: message } : f))
          );
          return;
        }

        const data: ImportApiResponse = await res.json();
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: data.success ? 'completed' : 'error',
                  commitResult: data,
                  errorMessage: data.errors.length > 0 ? data.errors.join('; ') : undefined,
                }
              : f
          )
        );

        // Update overall summary
        setAggregatedSummary((prev) => {
          const currentTotal = prev ? prev.totalFiles + 1 : 1;
          const currentSuccess = prev
            ? prev.successfulFiles + (data.success ? 1 : 0)
            : data.success
            ? 1
            : 0;
          const currentInserted = prev ? prev.totalInserted + data.inserted_records : data.inserted_records;
          const currentDropped = prev ? prev.totalDropped + data.dropped_records : data.dropped_records;
          return {
            totalFiles: currentTotal,
            successfulFiles: currentSuccess,
            totalInserted: currentInserted,
            totalDropped: currentDropped,
            dateRange: data.date_range,
          };
        });

        setActivePreviewFile(null);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errMessage =
          err instanceof Error && err.name === 'AbortError'
            ? 'Ingestion timed out after 120 seconds.'
            : IMPORT_TEXTS.errors.genericError;
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: 'error', errorMessage: errMessage } : f))
        );
      }
    },
    [files, options]
  );

  /**
   * Iterates through all eligible files and commits them sequentially.
   */
  const commitAllFiles = useCallback(async () => {
    setIsProcessingAll(true);
    const eligible = files.filter((f) => f.status === 'pending' || f.status === 'readyToCommit');

    for (const item of eligible) {
      await commitSingleFile(item.id);
    }

    setIsProcessingAll(false);
  }, [files, commitSingleFile]);

  const closePreview = useCallback(() => {
    setActivePreviewFile(null);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        stageFiles(e.dataTransfer.files);
      }
    },
    [stageFiles]
  );

  return {
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
  };
}
