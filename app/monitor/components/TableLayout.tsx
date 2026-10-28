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
  title,
  cubicles,
  assignedPatients,
  cubicleDoctorMap = {},
  activeCall = null,
}: TableLayoutProps) {
  const currentMs = useCurrentTimeMs(activeCall !== null);

  const effectiveCubicles: Cubicle[] = cubicles.length > 0
    ? cubicles
    : [...new Set(assignedPatients.map(p => p.cubicleNum || title))].map((cNum, idx) => ({
        id: idx + 1,
        cubicleNum: cNum,
        category: title,
        room: 1,
      }));

  const uniqueRooms = [...new Set(effectiveCubicles.map(c => c.room))].sort((a, b) => a - b);

  if (effectiveCubicles.length === 0 && assignedPatients.length === 0) {
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
              {effectiveCubicles.map((cubicle) => {
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
              return (
                <tr key={room} className={MONITOR_STYLES.tableLayout.dataRow}>
                  <td className={MONITOR_STYLES.tableLayout.roomCell}>
                    {uniqueRooms.length > 1 ? `${MONITOR_TEXTS.tableLayout.roomPrefix}${room}` : title}
                  </td>
                  {effectiveCubicles.map((cubicle) => {
                    const isCubicleInRoom = cubicle.room === room || uniqueRooms.length === 1;
                    if (!isCubicleInRoom) {
                      return (
                        <td key={cubicle.id} className="border-l border-slate-200 bg-slate-50/50 align-middle text-center text-slate-300">
                          --
                        </td>
                      );
                    }

                    const patientsInCubicle = assignedPatients.filter(
                      p => (p.cubicleNum || title) === cubicle.cubicleNum
                    );
                    const sortedPatients = sortCubiclePatients(patientsInCubicle);
                    const activePatient = sortedPatients[0];
                    const waitingPatients = sortedPatients.slice(1);
                    const remainingWaiting = waitingPatients.length > 4 ? waitingPatients.length - 4 : 0;
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
                              {/* Large & Highlighted Serving Card */}
                              <div
                                style={isCalling ? undefined : { backgroundColor: '#cc3535' }}
                                className={isCalling ? MONITOR_STYLES.tableLayout.callingCard : MONITOR_STYLES.tableLayout.nowServingCard}
                              >
                                <div
                                  className={MONITOR_STYLES.tableLayout.activePulseDot}
                                  aria-hidden="true"
                                />
                                <span className={isCalling ? MONITOR_STYLES.tableLayout.nowCallingBadge : MONITOR_STYLES.tableLayout.nowServingBadge}>
                                  {isCalling && <i className="bx bxs-megaphone animate-bounce text-xs" aria-hidden="true" />}
                                  {isCalling ? MONITOR_TEXTS.tableLayout.nowCallingBadge : MONITOR_TEXTS.tableLayout.nowServingBadge}
                                </span>
                                <span className={MONITOR_STYLES.tableLayout.nowServingTicket}>
                                  {activePatient.patientNum}
                                </span>
                              </div>

                              {/* Minimum 4 upcoming queue roster excluding serving number */}
                              <div className={MONITOR_STYLES.tableLayout.upcomingRosterCard}>
                                <div className={MONITOR_STYLES.tableLayout.upcomingRosterHeader}>
                                  <span className={MONITOR_STYLES.tableLayout.nextBadge}>
                                    {MONITOR_TEXTS.tableLayout.nextBadge}
                                  </span>
                                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {waitingPatients.length > 0 ? `${waitingPatients.length} in line` : 'No queue'}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-1 w-full min-h-0 flex-1 justify-around">
                                  {[1, 2, 3, 4].map(pos => {
                                    const wp = waitingPatients[pos - 1];
                                    const isHero = pos === 1;
                                    return (
                                      <div
                                        key={pos}
                                        className={wp ? (isHero ? "flex items-center justify-between bg-blue-50/60 border border-blue-200 rounded px-2 py-0.5 text-xs font-bold shadow-2xs" : MONITOR_STYLES.tableLayout.upcomingRow) : MONITOR_STYLES.tableLayout.upcomingRowEmpty}
                                      >
                                        <span className={isHero ? "text-[10px] sm:text-xs font-black text-blue-700" : "text-[10px] sm:text-xs font-bold text-slate-500"}>
                                          #{pos}{isHero ? ' Next' : ''}
                                        </span>
                                        <span className={wp ? (isHero ? "font-black text-blue-900 text-base sm:text-lg lg:text-xl tabular-nums tracking-tight" : "font-black text-slate-900 text-sm sm:text-base lg:text-lg tabular-nums tracking-tight") : "font-bold text-slate-300 text-xs sm:text-sm tabular-nums"}>
                                          {wp?.patientNum || MONITOR_TEXTS.tableLayout.emptyPlaceholder}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {remainingWaiting > 0 && (
                                  <div className="text-center text-[10px] font-bold text-slate-500 py-0.5 leading-none">
                                    +{remainingWaiting} more in queue
                                  </div>
                                )}
                              </div>
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
