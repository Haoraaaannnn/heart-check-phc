'use client';

/**
 * @fileoverview Paired cubicle queue monitor layout.
 *
 * Renders active patient numbers side-by-side with assigned consultation cubicles
 * and physician names. Adapts dynamically to screen size and viewport dimensions
 * without overflowing or triggering scrollbars.
 *
 * @module app/monitor/components/PairedLayout
 */

import React from 'react';
import { Patient } from '@/types/Types';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

/** Props for {@link PairedLayout}. */
type PairedLayoutProps = {
  /** Service title. */
  title: string;
  /** Paired queue data containing patient records, next queue, and cubicle identifiers. */
  pairedData: {
    patient: Patient | null;
    cubicle: string;
    nextPatient?: Patient | null;
    waitingCount?: number;
  }[];
  /** Cubicle number display formatter. */
  formatCubicleDisplay: (cubicleNum: string) => string;
  /** Mapping of cubicle IDs to assigned physician names. */
  cubicleDoctorMap?: Record<string, string>;
  /** Actively called station or ticket details. */
  activeCall?: { ticket?: string; cubicle?: string | null; expiry: number } | null;
};

/**
 * Renders the paired cubicle layout for clinical consultations and examinations.
 *
 * @param props - Component props containing paired patient and cubicle data.
 * @returns The rendered paired layout element.
 */
export function PairedLayout({
  pairedData,
  formatCubicleDisplay,
  cubicleDoctorMap = {},
  activeCall = null,
}: PairedLayoutProps) {
  if (pairedData.length === 0) {
    return (
      <div className={MONITOR_STYLES.pairedLayout.container}>
        <div className={MONITOR_STYLES.pairedLayout.emptyStateWrap}>
          <p className={MONITOR_STYLES.pairedLayout.emptyStateText}>
            {MONITOR_TEXTS.pairedLayout.emptyState}
          </p>
        </div>
      </div>
    );
  }

  const isMultiColumn = pairedData.length > 4;

  if (isMultiColumn) {
    const leftPairs = pairedData.slice(0, Math.ceil(pairedData.length / 2));
    const rightPairs = pairedData.slice(Math.ceil(pairedData.length / 2));
    const maxRowCount = Math.max(leftPairs.length, rightPairs.length);

    return (
      <div className={MONITOR_STYLES.pairedLayout.container}>
        <div className={MONITOR_STYLES.pairedLayout.innerWrapper}>
          <div className="grid grid-cols-4 gap-3 lg:gap-6 mb-2 sm:mb-3 flex-shrink-0">
            <h2 className={MONITOR_STYLES.pairedLayout.headerTitle}>
              {MONITOR_TEXTS.pairedLayout.colQueueNumber}
            </h2>
            <h2 className={MONITOR_STYLES.pairedLayout.headerTitle}>
              {MONITOR_TEXTS.pairedLayout.colCubicleRoom}
            </h2>
            <h2 className={MONITOR_STYLES.pairedLayout.headerTitle}>
              {MONITOR_TEXTS.pairedLayout.colQueueNumber}
            </h2>
            <h2 className={MONITOR_STYLES.pairedLayout.headerTitle}>
              {MONITOR_TEXTS.pairedLayout.colCubicleRoom}
            </h2>
          </div>

          <div className={MONITOR_STYLES.pairedLayout.pairsList}>
            {Array.from({ length: maxRowCount }).map((_, rowIdx) => {
              const left = leftPairs[rowIdx];
              const right = rightPairs[rowIdx];
              const leftDoc = left?.cubicle ? cubicleDoctorMap[left.cubicle] : undefined;
              const rightDoc = right?.cubicle ? cubicleDoctorMap[right.cubicle] : undefined;

              const isLeftCalling = left?.patient && activeCall !== null &&
                Date.now() < activeCall.expiry &&
                (activeCall.cubicle === left.cubicle || activeCall.ticket === left.patient.patientNum);

              const isRightCalling = right?.patient && activeCall !== null &&
                Date.now() < activeCall.expiry &&
                (activeCall.cubicle === right.cubicle || activeCall.ticket === right.patient.patientNum);

              return (
                <div key={rowIdx} className="grid grid-cols-4 gap-3 lg:gap-6 flex-1 min-h-0 items-stretch">
                  {/* Left Column Queue Card */}
                  <div
                    style={left?.patient && !isLeftCalling ? { backgroundColor: '#cc3535' } : undefined}
                    className={left?.patient ? (isLeftCalling ? MONITOR_STYLES.pairedLayout.callingCard : MONITOR_STYLES.pairedLayout.nowServingCard) : MONITOR_STYLES.pairedLayout.standardServingCard}
                  >
                    {left?.patient ? (
                      <>
                        <span className={isLeftCalling ? MONITOR_STYLES.pairedLayout.nowCallingBadge : MONITOR_STYLES.pairedLayout.nowServingBadge}>
                          {isLeftCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                          {isLeftCalling ? MONITOR_TEXTS.pairedLayout.nowCallingBadge : MONITOR_TEXTS.pairedLayout.nowServingBadge}
                        </span>
                        <span className={MONITOR_STYLES.pairedLayout.nowServingTicketPrimary}>
                          {left.patient.patientNum}
                        </span>
                        {left.nextPatient && (
                          <div className={MONITOR_STYLES.pairedLayout.nextQueueStrip}>
                            <span className={MONITOR_STYLES.pairedLayout.nextQueueStripLabel}>
                              {MONITOR_TEXTS.pairedLayout.nextPrefix}
                            </span>
                            <span className={MONITOR_STYLES.pairedLayout.nextQueueStripTicket}>
                              {left.nextPatient.patientNum}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                        {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                      </span>
                    )}
                  </div>

                  {/* Left Column Cubicle Card */}
                  <div className={MONITOR_STYLES.pairedLayout.cubicleCard}>
                    {left?.cubicle ? (
                      <>
                        <span className={MONITOR_STYLES.pairedLayout.cubicleLabel}>
                          {formatCubicleDisplay(left.cubicle)}
                        </span>
                        {leftDoc && (
                          <span className={MONITOR_STYLES.pairedLayout.doctorLabel}>
                            {MONITOR_TEXTS.pairedLayout.doctorPrefix}{leftDoc}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                        {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                      </span>
                    )}
                  </div>

                  {/* Right Column Queue Card */}
                  <div
                    style={right?.patient && !isRightCalling ? { backgroundColor: '#cc3535' } : undefined}
                    className={right?.patient ? (isRightCalling ? MONITOR_STYLES.pairedLayout.callingCard : MONITOR_STYLES.pairedLayout.nowServingCard) : MONITOR_STYLES.pairedLayout.standardServingCard}
                  >
                    {right?.patient ? (
                      <>
                        <span className={isRightCalling ? MONITOR_STYLES.pairedLayout.nowCallingBadge : MONITOR_STYLES.pairedLayout.nowServingBadge}>
                          {isRightCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                          {isRightCalling ? MONITOR_TEXTS.pairedLayout.nowCallingBadge : MONITOR_TEXTS.pairedLayout.nowServingBadge}
                        </span>
                        <span className={MONITOR_STYLES.pairedLayout.nowServingTicketPrimary}>
                          {right.patient.patientNum}
                        </span>
                        {right.nextPatient && (
                          <div className={MONITOR_STYLES.pairedLayout.nextQueueStrip}>
                            <span className={MONITOR_STYLES.pairedLayout.nextQueueStripLabel}>
                              {MONITOR_TEXTS.pairedLayout.nextPrefix}
                            </span>
                            <span className={MONITOR_STYLES.pairedLayout.nextQueueStripTicket}>
                              {right.nextPatient.patientNum}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                        {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                      </span>
                    )}
                  </div>

                  {/* Right Column Cubicle Card */}
                  <div className={MONITOR_STYLES.pairedLayout.cubicleCard}>
                    {right?.cubicle ? (
                      <>
                        <span className={MONITOR_STYLES.pairedLayout.cubicleLabel}>
                          {formatCubicleDisplay(right.cubicle)}
                        </span>
                        {rightDoc && (
                          <span className={MONITOR_STYLES.pairedLayout.doctorLabel}>
                            {MONITOR_TEXTS.pairedLayout.doctorPrefix}{rightDoc}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                        {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={MONITOR_STYLES.pairedLayout.container}>
      <div className={MONITOR_STYLES.pairedLayout.innerWrapper}>
        <div className={MONITOR_STYLES.pairedLayout.headerRow}>
          <h2 className={MONITOR_STYLES.pairedLayout.headerTitle}>
            {MONITOR_TEXTS.pairedLayout.colQueueNumber}
          </h2>
          <h2 className={MONITOR_STYLES.pairedLayout.headerTitle}>
            {MONITOR_TEXTS.pairedLayout.colCubicleRoom}
          </h2>
        </div>

        <div className={MONITOR_STYLES.pairedLayout.pairsList}>
          {pairedData.map((pair, index) => {
            const doctorName = pair.cubicle ? cubicleDoctorMap[pair.cubicle] : undefined;
            const isCalling = pair.patient && activeCall !== null &&
              Date.now() < activeCall.expiry &&
              (activeCall.cubicle === pair.cubicle || activeCall.ticket === pair.patient.patientNum);

            return (
              <div key={index} className={MONITOR_STYLES.pairedLayout.pairRow}>
                <div
                  style={pair.patient && !isCalling ? { backgroundColor: '#cc3535' } : undefined}
                  className={pair.patient ? (isCalling ? MONITOR_STYLES.pairedLayout.callingCard : MONITOR_STYLES.pairedLayout.nowServingCard) : MONITOR_STYLES.pairedLayout.standardServingCard}
                >
                  {pair.patient ? (
                    <>
                      <span className={isCalling ? MONITOR_STYLES.pairedLayout.nowCallingBadge : MONITOR_STYLES.pairedLayout.nowServingBadge}>
                        {isCalling && <i className="bx bxs-megaphone animate-bounce text-sm sm:text-base" aria-hidden="true" />}
                        {isCalling ? MONITOR_TEXTS.pairedLayout.nowCallingBadge : MONITOR_TEXTS.pairedLayout.nowServingBadge}
                      </span>
                      <span className={MONITOR_STYLES.pairedLayout.nowServingTicketPrimary}>
                        {pair.patient.patientNum}
                      </span>
                      {pair.nextPatient && (
                        <div className={MONITOR_STYLES.pairedLayout.nextQueueStrip}>
                          <span className={MONITOR_STYLES.pairedLayout.nextQueueStripLabel}>
                            {MONITOR_TEXTS.pairedLayout.nextPrefix}
                          </span>
                          <span className={MONITOR_STYLES.pairedLayout.nextQueueStripTicket}>
                            {pair.nextPatient.patientNum}
                          </span>
                          {pair.waitingCount && pair.waitingCount > 1 ? (
                            <span className="text-white/80 text-xs font-bold">
                              (+{pair.waitingCount - 1})
                            </span>
                          ) : null}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                      {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                    </span>
                  )}
                </div>

                <div className={MONITOR_STYLES.pairedLayout.cubicleCard}>
                  {pair.cubicle ? (
                    <>
                      <span className={MONITOR_STYLES.pairedLayout.cubicleLabel}>
                        {formatCubicleDisplay(pair.cubicle)}
                      </span>
                      {doctorName && (
                        <span className={MONITOR_STYLES.pairedLayout.doctorLabel}>
                          {MONITOR_TEXTS.pairedLayout.doctorPrefix}{doctorName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                      {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}