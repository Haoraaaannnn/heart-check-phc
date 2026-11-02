/**
 * @fileoverview Modal dialog wrapper presenting the Doctors and Cubicles assignment panel.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/DoctorsModal
 */

'use client';

import React, { useEffect } from 'react';
import { DoctorsPanel } from '@/app/transfer/components/DoctorsPanel';
import { transferTexts } from '@/constants/texts/transferTexts';
import { transferModalStyles } from '@/constants/designs/transferStyles';

/**
 * Props for {@link DoctorsModal}.
 */
export interface DoctorsModalProps {
  /** Callback to close the doctors modal. */
  onClose: () => void;
}

/**
 * High-contrast modal container for managing hospital physicians and cubicle associations.
 *
 * @param props - Close callback.
 * @returns Rendered modal element.
 */
export function DoctorsModal({ onClose }: DoctorsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 overflow-hidden select-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctors-modal-title"
        style={{
          height: 'min(82vh, 660px)',
          maxHeight: 'calc(100dvh - 3rem)',
        }}
        className="relative w-full max-w-4xl flex flex-col rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-2xl overflow-hidden select-text animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Pinned Modal Header (Never scrolls, stays fixed) */}
        <div className="shrink-0 px-5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between gap-4 bg-slate-50/90 dark:bg-[#141414]">
          <div className="min-w-0 flex-1">
            <h1 id="doctors-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#f5f5f5] tracking-tight">
              Doctors & Station Assignment
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#888888] mt-0.5">
              Manage physician directory, availability status, and clinical cubicle assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ minHeight: 'auto' }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#242424] hover:bg-slate-100 dark:hover:bg-[#2e2e2e] border border-slate-300 dark:border-[#383838] rounded-lg transition shadow-2xs cursor-pointer shrink-0 !min-h-0"
          >
            {transferTexts.closeBtn}
          </button>
        </div>

        {/* Scrollable Modal Body (Only inside contents scroll) */}
        <div className="flex-1 min-h-0 overflow-y-auto phc-scroll p-4 sm:p-6">
          <DoctorsPanel />
        </div>
      </div>
    </div>
  );
}

export default DoctorsModal;