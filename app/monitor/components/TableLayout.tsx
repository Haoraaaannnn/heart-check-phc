'use client';

/**
 * @fileoverview Table roster queue monitor layout.
 *
 * Renders multi-room and multi-cubicle queue rosters (e.g. ECG, Warfarin, Consultation)
 * in an institutional high-contrast tabular matrix. Adapts dynamically to screen size
 * with zero horizontal or vertical scrollbars.
 *
 * @module app/monitor/components/TableLayout
 */

import React from 'react';
import { useCurrentTimeMs } from '@/hooks/useCurrentTimeMs';
import { Patient, Cubicle } from '@/types/Types';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';
import { sortCubiclePatients } from '@/app/monitor/lib/sortCubiclePatients';

/** Props for {@link TableLayout}. */
type TableLayoutProps = {
  /** Service title. */
  title: string;
  /** Active clinical cubicles. */
  cubicles: Cubicle[];
  /** Currently assigned patient records. */
  assignedPatients: Patient[];
  /** Cubicle number display formatter. */
  formatCubicleDisplay: (cubicleNum: string) => string;
  /** Mapping of cubicle IDs to assigned physician names. */
  cubicleDoctorMap?: Record<string, string>;
  /** Actively called station or ticket details. */
  activeCall?: { ticket?: string; cubicle?: string | null; expiry: number } | null;
};

/**
 * Extracts and formats cubicle identifier without redundant room prefix.
 *
 * @param cubicleNum - Raw cubicle identifier string.
 * @returns Formatted cubicle label.
 */
const formatCubicleOnly = (cubicleNum: string): string => {
  const cubicleMatch = cubicleNum.match(/C(\d+)$/);
  return cubicleMatch
    ? `${MONITOR_TEXTS.tableLayout.cubiclePrefix}${cubicleMatch[1]}`
    : cubicleNum;
};

/**
 * Renders the tabular queue layout for multi-patient and multi-room services.
 *
 * @param props - Component props containing cubicles, patients, and doctor map.
 * @returns The rendered table layout element.
 */
export function TableLayout({
  cubicles,
  assignedPatients,
  cubicleDoctorMap = {},
  activeCall = null,
}: TableLayoutProps) {
  const currentMs = useCurrentTimeMs(activeCall !== null);
  const uniqueRooms = [...new Set(cubicles.map(c => c.room))].sort((a, b) => a - b);

  if (cubicles.length === 0 && assignedPatients.length === 0) {
    return (
      <div className={MONITOR_STYLES.tableLayout.container}>
        <div className={MONITOR_STYLES.tableLayout.emptyStateWrap}>
          <p className={MONITOR_STYLES.tableLayout.emptyStateText}>
            {MONITOR_TEXTS.tableLayout.emptyState}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={MONITOR_STYLES.tableLayout.container}>
      <div className={MONITOR_STYLES.tableLayout.tableWrapper}>
        <table className={MONITOR_STYLES.tableLayout.table}>
          <thead>
            <tr className={MONITOR_STYLES.tableLayout.headerRow}>
              <th className={MONITOR_STYLES.tableLayout.headerCellRoom}>
                {MONITOR_TEXTS.tableLayout.colRoomCubicle}
              </th>
              {cubicles.map((cubicle) => {
                const displayName = formatCubicleOnly(cubicle.cubicleNum);
                const doctorName = cubicleDoctorMap[cubicle.cubicleNum];
                return (
                  <th key={cubicle.id} className={MONITOR_STYLES.tableLayout.headerCellCubicle}>
                    <div className="break-words">{displayName}</div>
                    {doctorName && (
                      <div className={MONITOR_STYLES.tableLayout.doctorSubHeader}>
                        {MONITOR_TEXTS.tableLayout.doctorPrefix}{doctorName}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {uniqueRooms.map((room) => {
              const roomCubicles = cubicles.filter(c => c.room === room);
              return (
                <tr key={room} className={MONITOR_STYLES.tableLayout.dataRow}>
                  <td className={MONITOR_STYLES.tableLayout.roomCell}>
                    {MONITOR_TEXTS.tableLayout.roomPrefix}{room}
                  </td>
                  {roomCubicles.map((cubicle) => {
                    const patientsInCubicle = assignedPatients.filter(
                      p => p.cubicleNum === cubicle.cubicleNum
                    );
                    const sortedPatients = sortCubiclePatients(patientsInCubicle);
                    const activePatient = sortedPatients[0];
                    const nextPatient = sortedPatients[1];
                    const remainingCount = sortedPatients.length > 2 ? sortedPatients.length - 2 : 0;
                    const isCalling = activePatient && activeCall !== null &&
                      currentMs < activeCall.expiry &&
                      (activeCall.cubicle === cubicle.cubicleNum || activeCall.ticket === activePatient.patientNum);

                    return (
                      <td key={cubicle.id} className={MONITOR_STYLES.tableLayout.cubicleCell}>
                        <div className={MONITOR_STYLES.tableLayout.cellContentWrap}>
                          {!activePatient ? (
                            <div className={MONITOR_STYLES.tableLayout.emptyCellText}>
                              {MONITOR_TEXTS.tableLayout.emptyPlaceholder}
                            </div>
                          ) : (
                            <>
                              <div
                                style={isCalling ? undefined : { backgroundColor: '#cc3535' }}
                                className={isCalling ? MONITOR_STYLES.tableLayout.callingCard : MONITOR_STYLES.tableLayout.nowServingCard}
                              >
                                <span className={isCalling ? MONITOR_STYLES.tableLayout.nowCallingBadge : MONITOR_STYLES.tableLayout.nowServingBadge}>
                                  {isCalling && <i className="bx bxs-megaphone animate-bounce text-xs" aria-hidden="true" />}
                                  {isCalling ? MONITOR_TEXTS.tableLayout.nowCallingBadge : MONITOR_TEXTS.tableLayout.nowServingBadge}
                                </span>
                                <span className={MONITOR_STYLES.tableLayout.nowServingTicket}>
                                  {activePatient.patientNum}
                                </span>
                                <div
                                  className={MONITOR_STYLES.tableLayout.activePulseDot}
                                  aria-hidden="true"
                                />
                              </div>

                              {nextPatient && (
                                <div className={MONITOR_STYLES.tableLayout.waitingCard}>
                                  <span className={MONITOR_STYLES.tableLayout.nextBadge}>
                                    {MONITOR_TEXTS.tableLayout.nextBadge}
                                  </span>
                                  <span className={MONITOR_STYLES.tableLayout.waitingTicket}>
                                    {nextPatient.patientNum}
                                  </span>
                                  {remainingCount > 0 && (
                                    <span className="text-[11px] font-bold text-slate-500">
                                      (+{remainingCount})
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
