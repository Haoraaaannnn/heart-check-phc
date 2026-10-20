/**
 * @fileoverview Confirmation dialog for deleting registration counter stations in SuperAdmin.
 *
 * Provides a high-contrast modal dialog adhering to AGENTS.md standards, replacing
 * native browser dialogs with a solid surface and explicit confirmation controls.
 *
 * @module app/superadmin/components/DeleteCounterModal
 */

import React from 'react';
import { FACILITIES_TEXTS } from '@/app/superadmin/facilities/constants/facilitiesTexts';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';

/** Counter data required for deletion confirmation. */
export interface CounterToDelete {
  /** Numeric identifier for the counter (e.g. 1 to 5). */
  counter_number: number;
  /** Custom station label (e.g. "Senior Priority") or null. */
  label: string | null;
  /** Active staff count currently assigned to this counter. */
  inUse: number;
}

/** Props for {@link DeleteCounterModal}. */
interface DeleteCounterModalProps {
  /** Counter targeted for deletion, or null if modal is closed. */
  counter: CounterToDelete | null;
  /** Whether the deletion request is actively in-flight. */
  loading: boolean;
  /** Any active deletion error message. */
  error: string;
  /** Cancellation handler to dismiss the dialog. */
  onClose: () => void;
  /** Confirmation handler to execute deletion. */
  onConfirm: () => void;
}

/**
 * Counter deletion confirmation modal dialog.
 *
 * @param props - Component properties.
 * @returns Modal dialog JSX or null if no counter is targeted.
 */
export const DeleteCounterModal: React.FC<DeleteCounterModalProps> = ({
  counter,
  loading,
  error,
  onClose,
  onConfirm,
}) => {
  const S = SUPERADMIN_STYLES.modal;
  const B = SUPERADMIN_STYLES.buttons;
  const T = FACILITIES_TEXTS.counters;

  if (!counter) return null;

  return (
    <div className={S.backdrop} role="dialog" aria-modal="true" aria-labelledby="delete-counter-modal-title">
      <div className={S.confirmPanel}>
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
            <i className="bx bx-error text-2xl" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-counter-modal-title" className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">
              {T.deleteModalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
              {T.deleteModalWarning}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Counter Details Callout */}
        <div className={S.callout}>
          <div className="text-xs text-slate-500 dark:text-[#a3a3a3]">{T.deleteModalTarget}</div>
          <div className="text-sm font-bold text-slate-900 dark:text-[#f5f5f5] pt-1">
            {T.counterPrefix} {counter.counter_number}
            {counter.label ? ` — ${counter.label}` : ''}
          </div>
          {counter.inUse > 0 && (
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 pt-1">
              <i className="bx bx-user-pin mr-1" aria-hidden="true" />
              {T.deleteModalInUseWarning(counter.inUse)}
            </div>
          )}
        </div>

        <p className="text-xs text-red-600 dark:text-red-400">
          {T.deleteModalDangerNote}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={B.secondary}
          >
            {T.cancelDeleteButton}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={B.danger}
          >
            {loading ? T.deletingButton : T.confirmDeleteButton}
          </button>
        </div>
      </div>
    </div>
  );
};
