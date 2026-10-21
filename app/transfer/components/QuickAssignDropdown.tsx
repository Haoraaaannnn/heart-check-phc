/**
 * @fileoverview Quick-Assign destination popover and action dropdown for tap-to-transfer interactions.
 *
 * Provides a self-contained, accessible touch-friendly destination picker that opens
 * immediately when a patient card is tapped, replacing persistent floating banners with
 * an intuitive, direct-action popover.
 *
 * Architectural Features:
 * - Clickable-level loading animations: Visual spinners and status pulses indicate in-flight state directly on clicked buttons.
 * - Weak signal resilience: Explicit button-level feedback eliminates user confusion during network latency without blocking modals.
 * - Direct station selection: Lists all active cubicles with doctor assignment and live capacity.
 * - Single-tap confirmation: Tapping an available cubicle commits the assignment and dismisses immediately.
 * - Auto-dismiss mechanics: Closes on outside pointer down, backdrop tap, or Escape key.
 * - Strict Separation of Concerns: Consumes centralized styles from quickAssignStyles and texts from transferTexts.
 *
 * @remarks
 * Conforms to AGENTS.md:
 * - High-contrast solid clinical surfaces (#1a1a1a, #141414, #242424, #2e2e2e).
 * - Centralized style dictionary in constants/designs/transferStyles.ts.
 * - Centralized text copy in constants/texts/transferTexts.ts.
 * - Strictly zero emojis in code, comments, and strings.
 *
 * @module app/transfer/components/QuickAssignDropdown
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Cubicle, Patient } from '@/types/Types';
import { MAX_PATIENTS_PER_CUBICLE } from '@/app/transfer/lib/constants';
import { transferTexts } from '@/constants/texts/transferTexts';
import { quickAssignStyles } from '@/constants/designs/transferStyles';

/**
 * Props for {@link QuickAssignDropdown}.
 */
export interface QuickAssignDropdownProps {
  /** The patient entity being assigned or managed. */
  patient: Patient;
  /** Available cubicle stations for assignment. */
  cubicles: Cubicle[];
  /** Doctor assignment mapping indexed by cubicle number. */
  cubicleDoctorMap?: Record<string, string>;
  /** Currently assigned patient lists indexed by cubicle number. */
  assignedPatients: Record<string, Patient[]>;
  /** Callback to execute the cubicle assignment. */
  onAssignToCubicle: (patient: Patient, cubicleNum: string) => void | Promise<boolean | void>;
  /** Callback to dismiss and close the dropdown without making changes. */
  onClose: () => void;
  /** Domain origin of the tapped patient: 'queue' or 'cubicle'. */
  sourceType?: 'queue' | 'cubicle';
  /** Current cubicle number if patient originated from a station. */
  currentCubicleNum?: string;
  /** Callback to return a cubicle patient back to the waiting queue. */
  onMoveBackToQueue?: (patient: Patient, cubicleNum: string) => void | Promise<boolean | void>;
  /** Text-to-speech audio announcement callback. */
  onSpeak?: (text: string, patientId: number) => void;
  /** Active service category name for contextual audio announcement. */
  categoryName?: string;
}

/**
 * Extracts a compact station badge identifier (e.g., "C1", "C2") from full cubicle strings
 * like "Consultation R5 C1" or "Cubicle 1" to fit cleanly inside compact tile badges.
 *
 * @param cubicleNum - Raw cubicle identifier string from the database.
 * @returns Concise badge label that fits cleanly inside fixed-dimension avatars.
 */
export function formatCubicleBadge(cubicleNum: string): string {
  if (!cubicleNum) return '';
  const trimmed = cubicleNum.trim();
  const cMatch = trimmed.match(/C(\d+)$/i);
  if (cMatch) {
    return `C${cMatch[1]}`;
  }
  const cubicleWordMatch = trimmed.match(/cubicle\s*(\d+)/i);
  if (cubicleWordMatch) {
    return `C${cubicleWordMatch[1]}`;
  }
  const rMatch = trimmed.match(/R(\d+)$/i);
  if (rMatch) {
    return `R${rMatch[1]}`;
  }
  if (trimmed.length <= 4) {
    return trimmed;
  }
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (lastWord.length <= 3) return lastWord;
  }
  return trimmed.slice(0, 3).toUpperCase();
}

/**
 * Self-contained popover dialog for direct one-tap patient cubicle allocation.
 *
 * @param props - Patient details, station lists, and assignment handlers.
 * @returns Rendered interactive popover dropdown or action sheet.
 */
export function QuickAssignDropdown({
  patient,
  cubicles,
  cubicleDoctorMap = {},
  assignedPatients,
  onAssignToCubicle,
  onClose,
  sourceType = 'queue',
  currentCubicleNum,
  onMoveBackToQueue,
  onSpeak,
}: QuickAssignDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  // Close on outside pointer down or Escape key (only when not loading)
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent | MouseEvent) => {
      if (pendingTarget) return; // Prevent dismissing while mutation in flight
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingTarget) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingTarget, onClose]);

  const isFromCubicle = sourceType === 'cubicle';
  const availableCubicles = cubicles.filter(
    c => !currentCubicleNum || c.cubicleNum !== currentCubicleNum
  );

  /**
   * Dispatches assignment with in-button spinner and closes the modal.
   */
  const handleAssignStation = async (cubicleNum: string) => {
    if (pendingTarget) return;
    setPendingTarget(cubicleNum);
    try {
      await onAssignToCubicle(patient, cubicleNum);
      onClose();
    } catch (err) {
      console.error('Failed to assign patient to station:', err);
      setPendingTarget(null);
    }
  };

  /**
   * Dispatches queue rollback with in-button spinner.
   */
  const handleMoveBackQueue = async () => {
    if (!onMoveBackToQueue || !currentCubicleNum || pendingTarget) return;
    setPendingTarget('queue');
    try {
      await onMoveBackToQueue(patient, currentCubicleNum);
      onClose();
    } catch (err) {
      console.error('Failed to return patient to queue:', err);
      setPendingTarget(null);
    }
  };

  /**
   * Dispatches audio call with in-button loading indicator.
   */
  const handleSpeakAction = () => {
    if (!onSpeak || pendingTarget) return;
    setPendingTarget('call');
    try {
      const num = patient.patientNum || '';
      const letter = num ? num.charAt(0) : '';
      const digits = num.length > 1 ? parseInt(num.slice(1), 10).toString() : '';
      onSpeak(
        `Number ${letter} ${digits}, Number ${letter} ${digits}, please proceed to ${currentCubicleNum}`,
        patient.id
      );
      onClose();
    } catch (err) {
      console.error('Failed to trigger audio announcement:', err);
      setPendingTarget(null);
    }
  };

  /**
   * Safely dismisses the quick assign dialog unless an assignment is in flight.
   */
  const handleClose = (e?: React.SyntheticEvent | Event) => {
    if (e) {
      e.stopPropagation();
    }
    if (pendingTarget) return;
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-assign-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(e);
        }
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(e);
        }
      }}
      className={quickAssignStyles.backdrop}
    >
      <div ref={panelRef} className={quickAssignStyles.dialogCard}>
        {/* Dropdown Header */}
        <div className={quickAssignStyles.header}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={quickAssignStyles.patientBadge}>
                {patient.patientNum}
              </span>
              <div className="min-w-0">
                <h3
                  id="quick-assign-title"
                  className={quickAssignStyles.title}
                >
                  {isFromCubicle
                    ? transferTexts.managePatientTitle
                    : transferTexts.quickAssignTitle}
                </h3>
                <p className={quickAssignStyles.subtitle}>
                  {isFromCubicle
                    ? transferTexts.managePatientSubtitle
                    : transferTexts.quickAssignSubtitle}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            onPointerDown={handleClose}
            disabled={pendingTarget !== null}
            className={quickAssignStyles.closeBtn}
            aria-label={transferTexts.closeBtn}
          >
            <svg
              className="w-4 h-4 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Dropdown Body: Available Stations */}
        <div className={quickAssignStyles.bodyList}>
          {/* Station Management Actions (if tapped from inside a cubicle) */}
          {isFromCubicle && currentCubicleNum && (
            <div className={quickAssignStyles.stationManagementSection}>
              {onMoveBackToQueue && (
                <button
                  type="button"
                  disabled={pendingTarget !== null}
                  onClick={handleMoveBackQueue}
                  className={`${quickAssignStyles.actionBtnBase} ${
                    pendingTarget === 'queue'
                      ? quickAssignStyles.queueBtnActive
                      : pendingTarget !== null
                      ? quickAssignStyles.queueBtnDisabled
                      : quickAssignStyles.queueBtnNormal
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className={quickAssignStyles.actionIconBoxAmber}>
                      {pendingTarget === 'queue' ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.2}
                            d="M11 17l-5-5m0 0l5-5m-5 5h12"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={quickAssignStyles.actionTitle}>
                        {transferTexts.moveToQueueBtn}
                      </p>
                      <p className={quickAssignStyles.actionSubtitleAmber}>
                        {transferTexts.moveToQueueSubtitle}
                      </p>
                    </div>
                  </div>
                  {pendingTarget === 'queue' ? (
                    <span className={quickAssignStyles.statusBadgeAmberPending}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-ping" />
                      {transferTexts.movingToQueue}
                    </span>
                  ) : (
                    <span className={quickAssignStyles.statusBadgeAmberNormal}>
                      {transferTexts.badgeReturn}
                    </span>
                  )}
                </button>
              )}

              {onSpeak && (
                <button
                  type="button"
                  disabled={pendingTarget !== null}
                  onClick={handleSpeakAction}
                  className={`${quickAssignStyles.actionBtnBase} ${
                    pendingTarget === 'call'
                      ? quickAssignStyles.callBtnActive
                      : pendingTarget !== null
                      ? quickAssignStyles.callBtnDisabled
                      : quickAssignStyles.callBtnNormal
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className={quickAssignStyles.actionIconBoxBlue}>
                      {pendingTarget === 'call' ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={quickAssignStyles.actionTitle}>
                        {transferTexts.callPatientAudioBtn}
                      </p>
                      <p className={quickAssignStyles.actionSubtitleBlue}>
                        {transferTexts.callPatientAudioSubtitle}
                      </p>
                    </div>
                  </div>
                  {pendingTarget === 'call' ? (
                    <span className={quickAssignStyles.statusBadgeBluePending}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-ping" />
                      {transferTexts.callingBtn}
                    </span>
                  ) : (
                    <span className={quickAssignStyles.statusBadgeBlueNormal}>
                      {transferTexts.badgeSpeaker}
                    </span>
                  )}
                </button>
              )}

              <p className={quickAssignStyles.transferHeading}>
                {transferTexts.moveToOtherCubicleHeading}
              </p>
            </div>
          )}

          {/* List of Destination Stations */}
          {availableCubicles.length === 0 ? (
            <p className={quickAssignStyles.emptyStationsNotice}>
              {transferTexts.noCubiclesConfigured}
            </p>
          ) : (
            availableCubicles.map(cubicle => {
              const occupants =
                (assignedPatients && assignedPatients[cubicle.cubicleNum]?.length) || 0;
              const isFull = occupants >= MAX_PATIENTS_PER_CUBICLE;
              const doctorName = cubicleDoctorMap[cubicle.cubicleNum];
              const isAssigningThis = pendingTarget === cubicle.cubicleNum;

              return (
                <button
                  key={cubicle.id}
                  type="button"
                  disabled={isFull || pendingTarget !== null}
                  onClick={() => handleAssignStation(cubicle.cubicleNum)}
                  className={`${quickAssignStyles.stationRowBase} ${
                    isAssigningThis
                      ? quickAssignStyles.stationRowAssigning
                      : isFull
                      ? quickAssignStyles.stationRowFull
                      : pendingTarget !== null
                      ? quickAssignStyles.stationRowDisabled
                      : quickAssignStyles.stationRowNormal
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <span
                      className={
                        isFull
                          ? quickAssignStyles.badgeFull
                          : isAssigningThis
                          ? quickAssignStyles.badgeAssigning
                          : quickAssignStyles.badgeAvailable
                      }
                      title={cubicle.cubicleNum}
                    >
                      {isAssigningThis ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        formatCubicleBadge(cubicle.cubicleNum)
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className={quickAssignStyles.stationTitle}>
                        {cubicle.room &&
                        !cubicle.cubicleNum.toLowerCase().startsWith('room')
                          ? `${transferTexts.roomPrefix} ${cubicle.room} · `
                          : ''}
                        {cubicle.cubicleNum}
                      </p>
                      <p className={quickAssignStyles.stationDoctor}>
                        {doctorName
                          ? `${transferTexts.doctorPrefix} ${doctorName}`
                          : transferTexts.unassignedDoctor}
                      </p>
                    </div>
                  </div>

                  {/* Occupancy Badge & Assign Action */}
                  <div className="shrink-0 flex items-center gap-2 ml-2">
                    <span
                      className={
                        isFull
                          ? quickAssignStyles.occupancyBadgeFull
                          : occupants === 0
                          ? quickAssignStyles.occupancyBadgeZero
                          : quickAssignStyles.occupancyBadgePartial
                      }
                    >
                      {isFull
                        ? transferTexts.occupancyFull
                        : transferTexts.occupancyLabel(occupants, MAX_PATIENTS_PER_CUBICLE)}
                    </span>

                    {!isFull &&
                      (isAssigningThis ? (
                        <span className={quickAssignStyles.assignPillInFlight}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          {transferTexts.assigningStation}
                        </span>
                      ) : (
                        <span className={quickAssignStyles.assignPillNormal}>
                          {transferTexts.badgeAssign}
                        </span>
                      ))}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={quickAssignStyles.footer}>
          <span className={quickAssignStyles.footerHint}>
            {transferTexts.dismissHint}
          </span>
          <button
            type="button"
            onClick={handleClose}
            onPointerDown={handleClose}
            disabled={pendingTarget !== null}
            className={quickAssignStyles.footerCloseBtn}
          >
            {transferTexts.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickAssignDropdown;
