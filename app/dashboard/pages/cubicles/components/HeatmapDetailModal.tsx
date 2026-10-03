/**
 * @fileoverview Modal dialog displaying granular consultation logs and efficiency metrics
 * for an individual examination cubicle across a selected hourly interval.
 *
 * @module app/dashboard/pages/cubicles/components/HeatmapDetailModal
 */

'use client';

import { useEffect } from 'react';
import {
  CUBICLES_STYLES,
  HEATMAP_SPEED_STYLES,
  HEATMAP_IDLE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type { HeatmapCellData } from '@/app/dashboard/pages/cubicles/types/cubicle';

interface HeatmapDetailModalProps {
  /** The analytical cell selected by the user, or null if modal is closed. */
  cell: HeatmapCellData | null;
  /** Callback to close the modal. */
  onClose: () => void;
}

/**
 * Inspection dialog presenting specific patient journeys and interval breakdown.
 *
 * @param props - Component properties.
 * @returns JSX element or null.
 */
export default function HeatmapDetailModal({ cell, onClose }: HeatmapDetailModalProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.heatmap.modal;

  // Handle escape key to dismiss modal
  useEffect(() => {
    if (!cell) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cell, onClose]);

  if (!cell) return null;

  const speedStyle = HEATMAP_SPEED_STYLES[cell.speedRating];
  const idleStyle = HEATMAP_IDLE_STYLES[cell.idleRating];

  return (
    <div
      className={S.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={S.modalCard} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={S.modalHeader}>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <h3 className={S.modalTitle}>{cell.cubicleNum}</h3>
              <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-content-muted border border-line">
                {cell.timeSlotLabel}
              </span>
            </div>
            <p className={S.modalSubtitle}>{T.title}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={S.modalCloseBtn}
            aria-label={T.close}
          >
            <i className="bx bx-x text-2xl" />
          </button>
        </div>

        {/* Body */}
        <div className={S.modalBody}>
          {/* Summary metrics grid */}
          <div className={S.modalStatGrid}>
            <div className={S.modalStatCard}>
              <span className={S.modalStatLabel}>{T.patientsTreated}</span>
              <p className={S.modalStatValue}>{cell.patientsCount}</p>
            </div>

            <div className={S.modalStatCard}>
              <span className={S.modalStatLabel}>{T.processingSpeed}</span>
              <p className={`font-mono text-base font-extrabold ${speedStyle.text}`}>
                {cell.avgSpeedMinutes > 0 ? `${cell.avgSpeedMinutes}m` : '—'}
              </p>
              <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mt-0.5 ${speedStyle.badge}`}>
                {cell.speedRating}
              </span>
            </div>

            <div className={S.modalStatCard}>
              <span className={S.modalStatLabel}>{T.idleDuration}</span>
              <p className={`font-mono text-base font-extrabold ${idleStyle.text}`}>
                {cell.idleMinutes}m
              </p>
              <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mt-0.5 ${idleStyle.badge}`}>
                {cell.idleRating}
              </span>
            </div>

            <div className={S.modalStatCard}>
              <span className={S.modalStatLabel}>{T.utilization}</span>
              <p className="font-mono text-base font-extrabold text-content">
                {cell.occupancyPercent}%
              </p>
              <span className="text-[10px] text-content-subtle mt-0.5 block">
                {cell.totalActiveMinutes}m active
              </span>
            </div>
          </div>

          {/* Consultation records log */}
          <div>
            <h4 className="text-xs font-bold text-content uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i className="bx bx-list-ul text-rose-500" />
              <span>{T.patientLog}</span>
            </h4>

            {cell.patients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-subtle/60 p-6 text-center text-xs text-content-muted">
                {T.noPatientsInSlot}
              </div>
            ) : (
              <div className={S.modalPatientList}>
                {cell.patients.map((patient) => (
                  <div key={patient.id} className={S.modalPatientRow}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs border border-rose-200 dark:border-rose-900">
                        <i className="bx bx-user" />
                      </div>
                      <div>
                        <span className="font-mono font-extrabold text-content">
                          {patient.patientNum}
                        </span>
                        <p className="text-[11px] text-content-muted">
                          {T.serviceLabel} <span className="font-medium text-content">{patient.service}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-content">
                        {patient.durationMinutes} mins
                      </span>
                      <p className="text-[10px] text-content-subtle font-mono">
                        {patient.consultStart} {patient.consultEnd ? `→ ${patient.consultEnd}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
