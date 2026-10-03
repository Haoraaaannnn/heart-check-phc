/**
 * @fileoverview Modal dialog displaying granular clinical telemetry for an inspected
 * patient ticket or cubicle examination station from the Flowchart Map.
 *
 * @module app/dashboard/pages/cubicles/components/FlowchartInspectionModal
 */

'use client';

import { useEffect } from 'react';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type {
  FlowchartPatientItem,
  FlowchartCubicleStation,
} from '@/app/dashboard/pages/cubicles/types/cubicle';

interface FlowchartInspectionModalProps {
  /** Selected patient or cubicle station entity, or null if modal is closed. */
  target: FlowchartPatientItem | FlowchartCubicleStation | null;
  /** Callback to close dialog. */
  onClose: () => void;
}

/**
 * Type guard checking if the inspection target is a cubicle station.
 *
 * @param obj - Target entity.
 * @returns True if cubicle station.
 */
function isStation(
  obj: FlowchartPatientItem | FlowchartCubicleStation
): obj is FlowchartCubicleStation {
  return 'category' in obj && 'cubicleNum' in obj;
}

/**
 * Inspection modal presenting deep operational telemetry.
 *
 * @param props - Component properties.
 * @returns JSX element or null.
 */
export default function FlowchartInspectionModal({
  target,
  onClose,
}: FlowchartInspectionModalProps) {
  const S = CUBICLES_STYLES.heatmap;
  const T = CUBICLES_TEXTS.flowchart.modal;

  useEffect(() => {
    if (!target) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const isCubicle = isStation(target);

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
              <h3 className={S.modalTitle}>
                {isCubicle ? target.cubicleNum : target.patientNum}
              </h3>
              <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-content-muted border border-line">
                {isCubicle ? target.category : target.service}
              </span>
            </div>
            <p className={S.modalSubtitle}>
              {isCubicle ? T.cubicleTitle : T.patientTitle}
            </p>
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
          {isCubicle ? (
            /* Cubicle station details */
            <div className="flex flex-col gap-4">
              <div className={S.modalStatGrid}>
                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Status</span>
                  <p className="text-base font-extrabold text-content capitalize">
                    {target.status}
                  </p>
                </div>

                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Today Consults</span>
                  <p className="text-base font-extrabold text-content">
                    {target.totalConsultationsToday}
                  </p>
                </div>

                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Day Avg Speed</span>
                  <p className="text-base font-extrabold text-content font-mono">
                    {target.avgSpeedTodayMinutes > 0 ? `${target.avgSpeedTodayMinutes}m` : '—'}
                  </p>
                </div>

                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>
                    {target.status === 'occupied' ? 'Elapsed Time' : 'Idle Turnaround'}
                  </span>
                  <p className="text-base font-extrabold text-content font-mono">
                    {target.status === 'occupied'
                      ? `${target.elapsedMinutes || 0}m`
                      : `${target.idleMinutes || 0}m`}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-content-muted">{T.doctor}</span>
                  <span className="font-bold text-content">
                    {target.assignedDoctor
                      ? `Dr. ${target.assignedDoctor}`
                      : 'No physician assigned'}
                  </span>
                </div>

                {target.currentPatient && (
                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="text-content-muted">Active Consultation:</span>
                    <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400">
                      {target.currentPatient.patientNum} ({target.currentPatient.service})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Patient ticket journey details */
            <div className="flex flex-col gap-4">
              <div className={S.modalStatGrid}>
                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Stage Elapsed</span>
                  <p className="text-base font-extrabold text-content font-mono">
                    {target.elapsedMinutes !== undefined ? `${target.elapsedMinutes}m` : '—'}
                  </p>
                </div>

                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Current Status</span>
                  <p className="text-base font-extrabold text-content capitalize">
                    {target.status}
                  </p>
                </div>

                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Assigned Room</span>
                  <p className="text-base font-extrabold text-content">
                    {target.cubicleNum || 'Unassigned'}
                  </p>
                </div>

                <div className={S.modalStatCard}>
                  <span className={S.modalStatLabel}>Service Type</span>
                  <p className="text-base font-extrabold text-content">
                    {target.service}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface p-4 flex flex-col gap-2.5 text-xs">
                {target.consultStart && (
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted">{T.consultStart}</span>
                    <span className="font-mono font-semibold text-content">
                      {target.consultStart.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {target.consultEnd && (
                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="text-content-muted">{T.consultEnd}</span>
                    <span className="font-mono font-semibold text-content">
                      {target.consultEnd.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
