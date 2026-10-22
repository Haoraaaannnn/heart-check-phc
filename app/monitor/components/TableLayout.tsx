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
import { Patient, Cubicle } from '@/types/Types';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { MONITOR_TEXTS } from '@/app/monitor/constants/monitorTexts';

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
}: TableLayoutProps) {
  const uniqueRooms = [...new Set(cubicles.map(c => c.room))].sort((a, b) => a - b);

  if (assignedPatients.length === 0) {
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
                    const sortedPatients = [...patientsInCubicle].sort(
                      (a, b) => new Date(a.called_at || 0).getTime() - new Date(b.called_at || 0).getTime()
                    );
                    return (
                      <td key={cubicle.id} className={MONITOR_STYLES.tableLayout.cubicleCell}>
                        <div className={MONITOR_STYLES.tableLayout.cellContentWrap}>
                          {sortedPatients.length === 0 ? (
                            <div className={MONITOR_STYLES.tableLayout.emptyCellText}>
                              {MONITOR_TEXTS.tableLayout.emptyPlaceholder}
                            </div>
                          ) : (
                            sortedPatients.map((patient, idx) =>
                              idx === 0 ? (
                                <div
                                  key={patient.id}
                                  className={MONITOR_STYLES.tableLayout.nowServingCard}
                                >
                                  <span className={MONITOR_STYLES.tableLayout.nowServingBadge}>
                                    {MONITOR_TEXTS.tableLayout.nowServingBadge}
                                  </span>
                                  <span className={MONITOR_STYLES.tableLayout.nowServingTicket}>
                                    {patient.patientNum}
                                  </span>
                                  <div
                                    className={MONITOR_STYLES.tableLayout.activePulseDot}
                                    aria-hidden="true"
                                  />
                                </div>
                              ) : (
                                <div
                                  key={patient.id}
                                  className={MONITOR_STYLES.tableLayout.waitingCard}
                                >
                                  <span className={MONITOR_STYLES.tableLayout.waitingTicket}>
                                    {patient.patientNum}
                                  </span>
                                </div>
                              )
                            )
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