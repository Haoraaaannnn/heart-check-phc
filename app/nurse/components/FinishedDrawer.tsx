/**
 * @fileoverview Slide-over drawer component displaying the Finished Today ledger.
 *
 * Prevents historical records from crowding primary operational screen real estate,
 * keeping the 3-column clinical pipeline fit-to-screen and non-scrollable.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 */

'use client';

import React, { useEffect } from 'react';
import { Patient } from '@/types/Types';
import { nurseTexts } from '../constants/nurseTexts';
import { NurseStyle } from '../constants/nurse';
import { FinishedTable } from './FinishedTable';

/**
 * Props for the FinishedDrawer component.
 */
export interface FinishedDrawerProps {
  /** Whether the drawer slide-over is actively visible. */
  isOpen: boolean;
  /** Callback to close and dismiss the drawer. */
  onClose: () => void;
  /** Finished patients dataset for today. */
  patients: Patient[];
}

/**
 * Slide-over drawer modal rendering completed patients and their timestamps.
 *
 * @param props - Visibility state, dismiss handler, and patient roster.
 * @returns The rendered drawer element or null if closed.
 */
export function FinishedDrawer({ isOpen, onClose, patients }: FinishedDrawerProps) {
  // Handle keyboard 'Escape' to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={NurseStyle.drawerOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="finished-drawer-title"
      className="animate-in fade-in duration-200"
    >
      <div
        style={NurseStyle.drawerContent}
        onClick={(e) => e.stopPropagation()}
        className="animate-in slide-in-from-right duration-250 border-l border-slate-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <i className="bx bx-check-double text-2xl" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="finished-drawer-title"
                  className="text-base font-bold text-slate-800 tracking-tight"
                >
                  {nurseTexts.stageFinishedHeading}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {patients.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {nurseTexts.drawerSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:bg-slate-300/60 transition cursor-pointer"
            aria-label={nurseTexts.btnCloseFinished}
          >
            <i className="bx bx-x text-2xl" aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 phc-scroll">
          <FinishedTable patients={patients} />
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
          >
            {nurseTexts.btnCloseFinished}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinishedDrawer;
