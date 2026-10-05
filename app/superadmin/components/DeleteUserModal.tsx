/**
 * @fileoverview Confirmation dialog for deleting staff user accounts in SuperAdmin.
 *
 * Provides a clear, destructive-action warning prompt requiring explicit confirmation
 * before invoking the account deletion API.
 *
 * @module app/superadmin/components/DeleteUserModal
 */

import React from 'react';
import { SuperadminUser } from '../types/superadmin';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface DeleteUserModalProps {
  /** User account slated for deletion, or null if modal is closed. */
  user: SuperadminUser | null;
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
 * Account deletion confirmation modal.
 *
 * @param props - Component properties.
 * @returns JSX element containing the confirmation dialog or null.
 */
export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  loading,
  error,
  onClose,
  onConfirm,
}) => {
  const S = SUPERADMIN_STYLES.modal;
  const B = SUPERADMIN_STYLES.buttons;
  const T = SUPERADMIN_TEXTS.deleteModal;

  if (!user) return null;

  return (
    <div className={S.backdrop} role="dialog" aria-modal="true">
      <div className={S.confirmPanel}>
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
            <i className="bx bx-error text-2xl" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">
              {T.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">
              {T.warning}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* User Details Callout */}
        <div className={S.callout}>
          <div className="text-xs text-slate-500 dark:text-[#a3a3a3]">Target Account:</div>
          <div className="text-sm font-bold text-slate-900 dark:text-[#f5f5f5]">{user.email}</div>
          <div className="text-xs text-slate-500 dark:text-[#a3a3a3]">
            Username: <span className="font-medium text-slate-700 dark:text-[#f5f5f5]">{user.username}</span> · Role:{' '}
            <span className="font-semibold uppercase text-[#a8071a] dark:text-[#f87171]">{user.role}</span>
          </div>
        </div>

        <p className="text-xs text-red-600 dark:text-red-400">
          {T.dangerNote}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={B.secondary}
          >
            {T.cancelButton}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={B.danger}
          >
            {loading ? T.deletingButton : T.confirmButton}
          </button>
        </div>
      </div>
    </div>
  );
};
