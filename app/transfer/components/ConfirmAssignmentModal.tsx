/**
 * @fileoverview Modal dialog for reviewing and confirming pending patient cubicle assignments.
 *
 * Replaces the previous header-based confirmation button with a focused, accessible
 * modal workflow. Displays affected patient numbers, designated destination cubicles,
 * and outbound SMS alert statuses before committing changes to Supabase and IndexedDB.
 *
 * @module app/transfer/components/ConfirmAssignmentModal
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '../constants/transferTexts';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 transition-opacity animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h2
              id="confirm-assignment-title"
              className="text-lg font-bold text-slate-800 tracking-tight"
            >
              {modalTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {transferTexts.confirmAssignmentModalDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            aria-label={transferTexts.closeBtn}
          >
            {transferTexts.closeBtn}
          </button>
        </div>

        {/* Modal Body: List of Pending Patient Assignments */}
        <div className="px-6 py-4 overflow-y-auto space-y-2.5 phc-scroll flex-1">
          {pendingPatients.map(patient => (
            <div
              key={patient.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#cc3535] font-black text-sm flex items-center justify-center shrink-0">
                  {patient.patientNum}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {patient.service}
                    </span>
                    {patient.subcategory && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 truncate">
                        {patient.subcategory}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                    {transferTexts.assignedToLabel}:{' '}
                    <span className="font-bold text-slate-700">
                      {patient.cubicleNum || transferTexts.queueTabTitle}
                    </span>
                  </p>

                  {Boolean(patient.phoneNum) && (
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5 break-words leading-tight">
                      {transferTexts.smsNotificationNotice}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                {patient.cubicleNum || 'Queue'}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {transferTexts.cancelAssignmentBtn}
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isConfirming}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#cc3535] hover:bg-red-700 active:bg-red-800 text-white transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
