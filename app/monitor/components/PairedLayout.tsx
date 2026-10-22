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
  /** Paired queue data containing patient records and cubicle identifiers. */
  pairedData: { patient: Patient | null; cubicle: string }[];
  /** Cubicle number display formatter. */
  formatCubicleDisplay: (cubicleNum: string) => string;
  /** Mapping of cubicle IDs to assigned physician names. */
  cubicleDoctorMap?: Record<string, string>;
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
              const isLeftFirst = rowIdx === 0;

              return (
                <div key={rowIdx} className="grid grid-cols-4 gap-3 lg:gap-6 flex-1 min-h-0 items-stretch">
                  {/* Left Column Pair */}
                  <div className={isLeftFirst ? MONITOR_STYLES.pairedLayout.nowServingCard : MONITOR_STYLES.pairedLayout.standardServingCard}>
                    {left?.patient ? (
                      <>
                        {isLeftFirst && (
                          <span className={MONITOR_STYLES.pairedLayout.nowServingBadge}>
                            {MONITOR_TEXTS.pairedLayout.nowServingBadge}
                          </span>
                        )}
                        <span className={isLeftFirst ? MONITOR_STYLES.pairedLayout.nowServingTicketPrimary : MONITOR_STYLES.pairedLayout.nowServingTicketSecondary}>
                          {left.patient.patientNum}
                        </span>
                      </>
                    ) : (
                      <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                        {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                      </span>
                    )}
                  </div>

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

                  {/* Right Column Pair */}
                  <div className={MONITOR_STYLES.pairedLayout.standardServingCard}>
                    {right?.patient ? (
                      <span className={MONITOR_STYLES.pairedLayout.nowServingTicketSecondary}>
                        {right.patient.patientNum}
                      </span>
                    ) : (
                      <span className={MONITOR_STYLES.pairedLayout.emptyCardText}>
                        {MONITOR_TEXTS.pairedLayout.emptyPlaceholder}
                      </span>
                    )}
                  </div>

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
            const isFirst = index === 0;

            return (
              <div key={index} className={MONITOR_STYLES.pairedLayout.pairRow}>
                <div className={isFirst ? MONITOR_STYLES.pairedLayout.nowServingCard : MONITOR_STYLES.pairedLayout.standardServingCard}>
                  {pair.patient ? (
                    <>
                      {isFirst && (
                        <span className={MONITOR_STYLES.pairedLayout.nowServingBadge}>
                          {MONITOR_TEXTS.pairedLayout.nowServingBadge}
                        </span>
                      )}
                      <span className={isFirst ? MONITOR_STYLES.pairedLayout.nowServingTicketPrimary : MONITOR_STYLES.pairedLayout.nowServingTicketSecondary}>
                        {pair.patient.patientNum}
                      </span>
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