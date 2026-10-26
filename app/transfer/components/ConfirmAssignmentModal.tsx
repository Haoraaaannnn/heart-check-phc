/**
 * @fileoverview Modal dialog for reviewing and confirming pending patient cubicle assignments.
 *
 * Replaces the previous header-based confirmation button with a focused, accessible
 * modal workflow. Displays affected patient numbers, designated destination cubicles,
 * and outbound SMS alert statuses before committing changes to Supabase and IndexedDB.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/ConfirmAssignmentModal
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '@/constants/texts/transferTexts';
import { transferModalStyles } from '@/constants/designs/transferStyles';

/**
 * Props for {@link ConfirmAssignmentModal}.
 */
export interface ConfirmAssignmentModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** List of patients with pending cubicle assignments awaiting confirmation. */
  pendingPatients: Patient[];
  /** Whether confirmation save mutation is currently executing. */
  isConfirming: boolean;
  /** A failed save keeps the dialog open and explains what the operator can retry. */
  error?: string;
  /** Callback to commit pending assignments to the backend. */
  onConfirm: () => void | Promise<void>;
  /** Callback to cancel and revert pending assignments. */
  onCancel: () => void;
}

/**
 * Modal dialog for confirming manual and drag-and-drop patient transfers.
 *
 * @param props - Dialog visibility, pending patients list, and confirmation callbacks.
 * @returns The rendered confirmation modal element or null when closed.
 */
export function ConfirmAssignmentModal({
  isOpen,
  pendingPatients,
  isConfirming,
  error,
  onConfirm,
  onCancel,
}: ConfirmAssignmentModalProps) {
  if (!isOpen || pendingPatients.length === 0) {
    return null;
  }

  const isPlural = pendingPatients.length > 1;
  const modalTitle = isPlural
    ? transferTexts.confirmAssignmentsModalTitle
    : transferTexts.confirmAssignmentModalTitle;
  const confirmButtonLabel = isPlural
    ? transferTexts.confirmAssignmentsBtn
    : transferTexts.confirmAssignmentBtn;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-assignment-title"
      className={transferModalStyles.backdrop}
    >
      <div className={transferModalStyles.dialogCard}>
        {/* Modal Header */}
        <div className={transferModalStyles.header}>
          <div>
            <h2
              id="confirm-assignment-title"
              className={transferModalStyles.title}
            >
              {modalTitle}
            </h2>
            <p className={transferModalStyles.description}>
              {transferTexts.confirmAssignmentModalDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className={transferModalStyles.closeBtn}
            aria-label={transferTexts.closeBtn}
          >
            {transferTexts.closeBtn}
          </button>
        </div>

        {/* Modal Body: List of Pending Patient Assignments */}
        <div className={transferModalStyles.bodyList}>
          {error && <p role="alert" className="p-3 border border-red-200 rounded-lg bg-red-50 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-200">{error}</p>}
          {pendingPatients.map(patient => (
            <div
              key={patient.id}
              className={transferModalStyles.patientRow}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={transferModalStyles.patientNumBadge}>
                  {patient.patientNum}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={transferModalStyles.patientServiceText}>
                      {patient.service}
                    </span>
                    {patient.subcategory && (
                      <span className={transferModalStyles.patientSubcategoryBadge}>
                        {patient.subcategory}
                      </span>
                    )}
                  </div>

                  <p className={transferModalStyles.assignedLabel}>
                    {transferTexts.assignedToLabel}:{' '}
                    <span className={transferModalStyles.assignedTargetVal}>
                      {patient.cubicleNum || transferTexts.queueTabTitle}
                    </span>
                  </p>

                  {Boolean(patient.phoneNum) && (
                    <p className={transferModalStyles.smsNotice}>
                      {transferTexts.smsNotificationNotice}
                    </p>
                  )}
                </div>
              </div>

              <span className={transferModalStyles.destinationBadge}>
                {patient.cubicleNum || 'Queue'}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className={transferModalStyles.footer}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className={transferModalStyles.cancelBtn}
          >
            {transferTexts.cancelAssignmentBtn}
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isConfirming}
            className={transferModalStyles.confirmBtn}
          >
            {isConfirming ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                <span>{transferTexts.savingAssignment}</span>
              </>
            ) : (
              <span>{confirmButtonLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAssignmentModal;
