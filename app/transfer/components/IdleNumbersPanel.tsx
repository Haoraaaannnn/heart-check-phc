/**
 * @fileoverview Panel presenting patients in idle status (timed out 5+ times).
 *
 * Implements smooth internal scrolling for the idle list while preserving
 * rotation timeout counter badge (`×N`) and one-click reactivation or removal actions.
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/IdleNumbersPanel
 */

'use client';

import React from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '@/constants/texts/transferTexts';
import { idlePanelStyles } from '@/constants/designs/transferStyles';

/**
 * Props for {@link IdleNumbersPanel}.
 */
export interface IdleNumbersPanelProps {
  /** Array of idle patients. */
  patients: Patient[];
  /** Callback to restore an idle patient back to active queue. */
  onActivate: (patient: Patient) => void;
  /** Callback to permanently dismiss an idle patient. */
  onRemove: (patient: Patient) => void;
  /** Optional compact styling flag. */
  compact?: boolean;
}

/**
 * Idle Numbers panel fitting inside the QueuePanel with smooth internal scrolling.
 *
 * @param props - Patient data and state transition callbacks.
 * @returns The rendered IdleNumbersPanel component.
 */
export function IdleNumbersPanel({
  patients,
  onActivate,
  onRemove,
}: IdleNumbersPanelProps) {
  const safePatients = Array.isArray(patients) ? patients : [];

  return (
    <div className={idlePanelStyles.wrapper}>
      {/* Header */}
      <div className={idlePanelStyles.header}>
        <div className={idlePanelStyles.headerLeft}>
          <span className={idlePanelStyles.headerDot} />
          <h2 className={idlePanelStyles.headerTitle}>
            {transferTexts.idleNumbersHeading}
          </h2>
          <span className={idlePanelStyles.headerCountBadge}>
            {safePatients.length}
          </span>
        </div>
        <span className={idlePanelStyles.headerSubtitle}>
          {transferTexts.idleSubtitle}
        </span>
      </div>

      {/* Patients List (Scrollable when exceeding height) */}
      {safePatients.length === 0 ? (
        <div className={idlePanelStyles.emptyNotice}>
          {transferTexts.noIdleNumbers}
        </div>
      ) : (
        <div className={idlePanelStyles.scrollList}>
          {safePatients.map(p => (
            <div key={p.id} className={idlePanelStyles.patientRow}>
              <div className={idlePanelStyles.patientInfo}>
                <span className={idlePanelStyles.patientNumBadge}>
                  {p.patientNum}
                </span>
                <span className={idlePanelStyles.serviceLabel}>
                  {p.service}
                  {p.subcategory && (
                    <span className={idlePanelStyles.subCategoryLabel}>
                      {` · ${p.subcategory}`}
                    </span>
                  )}
                </span>
                <span className={idlePanelStyles.rotationBadge}>
                  {transferTexts.rotationCountPrefix}
                  {p.rotation_count ?? 0}
                </span>
              </div>

              <div className={idlePanelStyles.actionsWrap}>
                <button
                  type="button"
                  onClick={() => onActivate(p)}
                  title={transferTexts.activateIdleTooltip}
                  className={idlePanelStyles.activateBtn}
                >
                  {transferTexts.activateBtn}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(p)}
                  title={transferTexts.removeIdleTooltip}
                  className={idlePanelStyles.removeBtn}
                >
                  {transferTexts.removeBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IdleNumbersPanel;
