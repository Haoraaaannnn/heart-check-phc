/**
 * @fileoverview Session export history table component for the Admin Dashboard.
 *
 * Displays downloads generated during the active browser session, providing
 * re-download triggers, format tags, and history clearing controls.
 *
 * @remarks
 * Strictly conforms to AGENTS.md high-contrast solid surface and no text truncation rules.
 *
 * @module app/dashboard/pages/export/components/ExportHistoryList
 */

'use client';

import React from 'react';
import { EXPORT_STYLES } from '../constants/exportStyles';
import { EXPORT_TEXTS } from '../constants/exportTexts';
import { ExportHistoryItem } from '../types/exportTypes';

/**
 * Properties for the {@link ExportHistoryList} component.
 */
export interface ExportHistoryListProps {
  /** Array of session history items. */
  history: ExportHistoryItem[];
  /** Action handler to re-download a cached item. */
  onRedownload: (id: string) => void;
  /** Action handler to clear history. */
  onClearHistory: () => void;
}

/**
 * Formats byte size into human-readable string.
 *
 * @param bytes - Byte count.
 * @returns Formatted size e.g. "45.2 KB".
 */
function formatSize(bytes?: number): string {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Session export history list component.
 *
 * @param props - Component configuration properties.
 * @returns Rendered JSX element.
 */
export default function ExportHistoryList({
  history,
  onRedownload,
  onClearHistory,
}: ExportHistoryListProps): React.ReactElement {
  const S = EXPORT_STYLES.history;
  const T = EXPORT_TEXTS.history;

  if (history.length === 0) {
    return (
      <div className={S.card}>
        <div className={S.header}>
          <div>
            <h2 className={S.title}>
              <span>{T.title}</span>
              <span className={S.badge}>0</span>
            </h2>
            <p className={S.subtitle}>{T.subtitle}</p>
          </div>
        </div>
        <div className={S.emptyBox}>
          <i className="bx bx-download text-3xl mb-2 text-slate-300 dark:text-[#737373] block" />
          <p>{T.emptyNotice}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={S.card}>
      <div className={S.header}>
        <div>
          <h2 className={S.title}>
            <span>{T.title}</span>
            <span className={S.badge}>{history.length}</span>
          </h2>
          <p className={S.subtitle}>{T.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className={S.clearButton}
        >
          <i className="bx bx-trash mr-1" />
          <span>{T.clearHistoryButton}</span>
        </button>
      </div>

      <div className={S.tableWrapper}>
        <table className={S.table}>
          <thead className={S.thead}>
            <tr>
              <th className={S.th}>{T.tableHeaders.filename}</th>
              <th className={S.th}>{T.tableHeaders.period}</th>
              <th className={S.th}>{T.tableHeaders.service}</th>
              <th className={S.th}>{T.tableHeaders.format}</th>
              <th className={S.th}>{T.tableHeaders.timestamp}</th>
              <th className={S.th}>{T.tableHeaders.status}</th>
              <th className={`${S.th} text-right`}>{T.tableHeaders.actions}</th>
            </tr>
          </thead>
          <tbody className={S.tbody}>
            {history.map((item) => {
              const timeString = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <tr key={item.id} className={S.tr}>
                  <td className={S.td}>
                    <div className="flex items-center gap-2">
                      <i
                        className={`bx ${item.format === 'xlsx' ? 'bxs-file-export text-emerald-600' : 'bx-table text-blue-600'} text-base`}
                      />
                      <span className="font-semibold text-slate-900 dark:text-[#f5f5f5] font-mono">
                        {item.filename}
                      </span>
                    </div>
                    {item.fileSizeBytes && (
                      <span className="text-[10px] text-slate-400 dark:text-[#737373] block mt-0.5 ml-6">
                        {formatSize(item.fileSizeBytes)}
                      </span>
                    )}
                  </td>
                  <td className={S.td}>{item.periodLabel}</td>
                  <td className={S.td}>{item.serviceLabel}</td>
                  <td className={S.td}>
                    <span className="rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#f5f5f5]">
                      {item.format}
                    </span>
                  </td>
                  <td className={S.td}>{timeString}</td>
                  <td className={S.td}>
                    <span
                      className={
                        item.status === 'success'
                          ? S.statusBadge.success
                          : S.statusBadge.failed
                      }
                    >
                      {item.status === 'success' ? 'Completed' : 'Failed'}
                    </span>
                  </td>
                  <td className={`${S.td} text-right`}>
                    <button
                      type="button"
                      onClick={() => onRedownload(item.id)}
                      className={S.redownloadBtn}
                      title="Download this file again"
                    >
                      <i className="bx bx-download text-sm" />
                      <span>{T.redownloadButton}</span>
                    </button>
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
