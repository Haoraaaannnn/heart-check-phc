/**
 * @fileoverview Confirmation dialog for deleting kiosk services in SuperAdmin.
 *
 * Provides a high-contrast modal dialog adhering to AGENTS.md standards, replacing
 * native browser dialogs with a solid surface and explicit confirmation controls.
 *
 * @module app/superadmin/customization/components/DeleteServiceModal
 */

import React from 'react';
import { Service } from '@/types/Services';
import { CUSTOMIZATION_TEXTS } from '../constants/customizationTexts';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';

/** Props for {@link DeleteServiceModal}. */
interface DeleteServiceModalProps {
  /** Service targeted for deletion, or null if modal is closed. */
  service: Service | null;
  /** Whether the deletion request is actively in-flight. */
  loading: boolean;
  /** Any active deletion error message. */
  error: string | null;
  /** Cancellation handler to dismiss the dialog. */
  onClose: () => void;
  /** Confirmation handler to execute deletion. */
  onConfirm: () => void;
}

/**
 * Service deletion confirmation modal dialog.
 *
 * @param props - Component properties.
 * @returns Modal dialog JSX or null if no service is targeted.
 */
export const DeleteServiceModal: React.FC<DeleteServiceModalProps> = ({
  service,
  loading,
  error,
  onClose,
  onConfirm,
}) => {
  const S = SUPERADMIN_STYLES.modal;
  const B = SUPERADMIN_STYLES.buttons;
  const T = CUSTOMIZATION_TEXTS.deleteModal;

  if (!service) return null;

  return (
    <div className={S.backdrop} role="dialog" aria-modal="true" aria-labelledby="delete-service-modal-title">
      <div className={S.confirmPanel}>
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
            <i className="bx bx-error text-2xl" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-service-modal-title" className="text-base font-bold text-slate-900 dark:text-[#f5f5f5]">
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

        {/* Service Details Callout */}
        <div className={S.callout}>
          <div className="text-xs text-slate-500 dark:text-[#a3a3a3]">{T.calloutTarget}</div>
          <div className="flex items-center gap-2 pt-1">
            <i className={`bx ${service.icon_src} text-lg text-[#a8071a] dark:text-[#f87171] shrink-0`} aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-[#f5f5f5] block">
                {service.label_en}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#a3a3a3] italic block">
                {service.label_fil}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-[#a3a3a3] pt-1">
            {T.eligibilityLabel}:{' '}
            <span className="font-semibold uppercase text-slate-700 dark:text-[#f5f5f5]">
              {service.patient_type}
            </span>
            {' · '}
            {T.ticketFormatLabel}:{' '}
            <span className="font-mono font-medium text-slate-700 dark:text-[#f5f5f5]">
              {service.queue_prefix ? `${service.queue_prefix}###` : T.noPrefixFallback}
            </span>
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
