/**
 * @fileoverview Staged files queue table component for the Admin Dashboard.
 *
 * Displays pending, active, and completed files staged for ingestion.
 * Provides controls to inspect schema previews, execute individual or batch imports,
 * and view error diagnostics.
 *
 * @module app/dashboard/pages/import/components/StagedFileList
 */

'use client';

import React from 'react';
import { IMPORT_STYLES } from '@/app/dashboard/pages/import/constants/importStyles';
import { IMPORT_TEXTS } from '@/app/dashboard/pages/import/constants/importTexts';
import { StagedFile } from '@/app/dashboard/pages/import/types/importTypes';

/**
 * Properties for the {@link StagedFileList} component.
 */
export interface StagedFileListProps {
  /** Array of staged files. */
  files: StagedFile[];
  /** Whether batch processing is actively running. */
  isProcessingAll: boolean;
  /** Action handler to inspect/preview a single file. */
  onInspect: (id: string) => void;
  /** Action handler to import an individual file. */
  onImportSingle: (id: string) => void;
  /** Action handler to import all queued files. */
  onImportAll: () => void;
  /** Action handler to remove a file from the queue. */
  onRemove: (id: string) => void;
  /** Action handler to clear all files. */
  onClearAll: () => void;
}

/**
 * Formats byte count into human-readable size string.
 *
 * @param bytes - Size in bytes.
 * @returns Formatted size string e.g. "1.82 MB".
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Staged files queue component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function StagedFileList({
  files,
  isProcessingAll,
  onInspect,
  onImportSingle,
  onImportAll,
  onRemove,
  onClearAll,
}: StagedFileListProps): React.ReactElement {
  const S = IMPORT_STYLES.stagedFiles;
  const T = IMPORT_TEXTS.stagedFiles;

  if (files.length === 0) {
    return (
      <div className={S.card}>
        <div className={S.header}>
          <div className={S.titleBlock}>
            <h3 className={S.title}>
              <span>{T.title}</span>
              <span className={S.badge}>0</span>
            </h3>
            <p className={S.subtitle}>{T.subtitle}</p>
          </div>
        </div>
        <div className={S.emptyBox}>
          <i className="bx bx-file-blank text-3xl mb-2 text-slate-300 dark:text-[#737373] block" />
          <p>{T.emptyNotice}</p>
        </div>
      </div>
    );
  }

  const eligibleCount = files.filter(
    (f) => f.status === 'pending' || f.status === 'readyToCommit'
  ).length;

  return (
    <div className={S.card}>
      <div className={S.header}>
        <div className={S.titleBlock}>
          <h3 className={S.title}>
            <span>{T.title}</span>
            <span className={S.badge}>{files.length}</span>
          </h3>
          <p className={S.subtitle}>{T.subtitle}</p>
        </div>

        <div className={S.actionsRow}>
          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessingAll}
            className={S.clearButton}
          >
            <i className="bx bx-trash" />
            <span>{T.actions.clearAll}</span>
          </button>

          <button
            type="button"
            onClick={onImportAll}
            disabled={isProcessingAll || eligibleCount === 0}
            className={S.importAllButton}
          >
            {isProcessingAll ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{T.status.importing}</span>
              </>
            ) : (
              <>
                <i className="bx bx-cloud-upload text-sm" />
                <span>
                  {T.actions.importAll} ({eligibleCount})
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={S.tableWrapper}>
        <table className={S.table}>
          <thead className={S.thead}>
            <tr>
              <th className={S.th}>{T.tableHeaders.name}</th>
              <th className={S.th}>{T.tableHeaders.size}</th>
              <th className={S.th}>{T.tableHeaders.format}</th>
              <th className={S.th}>{T.tableHeaders.status}</th>
              <th className={S.th}>{T.tableHeaders.actions}</th>
            </tr>
          </thead>
          <tbody className={S.tbody}>
            {files.map((file) => {
              const isInspectable =
                file.status === 'pending' || file.status === 'readyToCommit';
              const isImportable =
                file.status === 'pending' || file.status === 'readyToCommit';
              const isBusy =
                file.status === 'inspecting' || file.status === 'importing';

              return (
                <tr key={file.id} className={S.tr}>
                  {/* File Name */}
                  <td className={S.td}>
                    <div className={S.fileName}>
                      <i
                        className={`bx ${
                          file.name.endsWith('.csv')
                            ? 'bx-table'
                            : 'bx-file-blank'
                        } ${S.fileIcon}`}
                      />
                      <span className="font-medium break-all">{file.name}</span>
                    </div>
                    {file.errorMessage && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {file.errorMessage}
                      </p>
                    )}
                  </td>

                  {/* File Size */}
                  <td className={S.td}>
                    <span className="text-slate-600 dark:text-[#a3a3a3] font-mono">
                      {formatFileSize(file.size)}
                    </span>
                  </td>

                  {/* Format Pill */}
                  <td className={S.td}>
                    <span className={`${S.typePill} bg-slate-100 text-slate-700 dark:bg-[#242424] dark:text-[#a3a3a3] border border-slate-200/80 dark:border-[#2e2e2e]`}>
                      {file.extension.toUpperCase()}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className={S.td}>
                    <span className={S.statusBadge[file.status]}>
                      {T.status[file.status]}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className={S.td}>
                    <div className={S.actionButtonsRow}>
                      {isInspectable && (
                        <button
                          type="button"
                          onClick={() => onInspect(file.id)}
                          disabled={isBusy || isProcessingAll}
                          className={S.inspectButton}
                          title={T.actions.inspect}
                        >
                          <i className="bx bx-search-alt text-xs mr-1" />
                          <span>{T.actions.inspect}</span>
                        </button>
                      )}

                      {isImportable && (
                        <button
                          type="button"
                          onClick={() => onImportSingle(file.id)}
                          disabled={isBusy || isProcessingAll}
                          className={S.importSingleButton}
                          title={T.actions.importSingle}
                        >
                          <i className="bx bx-upload text-xs mr-1" />
                          <span>{T.actions.importSingle}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemove(file.id)}
                        disabled={isBusy || isProcessingAll}
                        className={S.removeButton}
                        title={T.actions.remove}
                        aria-label={T.actions.remove}
                      >
                        <i className="bx bx-x text-base" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
