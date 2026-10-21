/**
 * @fileoverview Modal dialog wrapper presenting the Doctors and Cubicles assignment panel.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/DoctorsModal
 */

'use client';

import React from 'react';
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
  return (
    <div className={transferModalStyles.backdrop}>
      <div className={transferModalStyles.dialogCardLarge}>
        <button
          type="button"
          onClick={onClose}
          className={transferModalStyles.closeBtnAbsolute}
        >
          {transferTexts.closeBtn}
        </button>
        <h1 className={transferModalStyles.largeTitle}>
          {transferTexts.doctorsBtn}
        </h1>
        <DoctorsPanel />
      </div>
    </div>
  );
}

export default DoctorsModal;