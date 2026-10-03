/**
 * @fileoverview Individual workflow stage card component for the Outpatient Pipeline Flowchart.
 *
 * Renders stage identity, active patient volume count, stage efficiency metrics,
 * and an interactive list of tickets progressing through this phase.
 *
 * @module app/dashboard/pages/cubicles/components/FlowchartStageCard
 */

'use client';

import {
  CUBICLES_STYLES,
  PIPELINE_STAGE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import type {
  FlowchartStageData,
  FlowchartPatientItem,
} from '@/app/dashboard/pages/cubicles/types/cubicle';

interface FlowchartStageCardProps {
  /** The stage data model containing count, metrics, and patient collection. */
  stage: FlowchartStageData;
  /** Callback triggered when clicking an individual patient ticket for detailed inspection. */
  onSelectPatient: (patient: FlowchartPatientItem) => void;
}

/**
 * Visual card representing a discrete stage in the outpatient cubicle pipeline.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function FlowchartStageCard({
  stage,
  onSelectPatient,
}: FlowchartStageCardProps) {
  const S = CUBICLES_STYLES.flowchart;
  const style = PIPELINE_STAGE_STYLES[stage.key];

  return (
    <div className={`${S.stageCard} ${style.border} ${style.bg}`}>
      {/* Stage Header */}
      <div className={`${S.stageHeader} ${style.headerBorder}`}>
        <div className={S.stageTitleGroup}>
          <div className={`${S.stageIconWrap} ${style.iconBg} ${style.iconText}`}>
            <i className={`bx ${stage.icon}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className={S.stageTitle}>{stage.title}</h3>
            <span className={S.stageSubtitle}>{stage.subtitle}</span>
          </div>
        </div>

        <span className={`${S.stageBadge} ${style.badgeBg} ${style.badgeText}`}>
          {stage.count}
        </span>
      </div>

      {/* Stage Body */}
      <div className={S.stageBody}>
        {/* Metric Strip */}
        <div
          className={`${S.stageMetricStrip} ${style.metricBg} ${style.metricBorder}`}
        >
          <span className="text-[11px] font-semibold text-content-muted">
            {stage.metricLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-extrabold text-content">
              {stage.metricValue}
            </span>
            {stage.alertCount !== undefined && stage.alertCount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                <i className="bx bx-error-circle" />
                {stage.alertCount} overdue
              </span>
            )}
          </div>
        </div>

        {/* Patient Tickets List */}
        <div className={S.stagePatientList}>
          {stage.patients.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-line bg-surface/40 p-3 text-center text-[11px] text-content-muted">
              No patients in this stage
            </div>
          ) : (
            stage.patients.slice(0, 10).map((patient) => {
              const isStalled = patient.isStalled;

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient)}
                  className={`${S.patientPill} ${style.pillBg} ${
                    isStalled
                      ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 ring-1 ring-rose-400/50'
                      : `${style.pillBorder} ${style.pillText}`
                  }`}
                  title={`Click to inspect ticket ${patient.patientNum}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <i className="bx bx-user text-xs opacity-75 shrink-0" />
                    <span className="truncate">{patient.patientNum}</span>
                    {patient.cubicleNum && (
                      <span className="rounded bg-surface-subtle px-1 py-0.2 text-[9px] font-medium text-content-muted border border-line shrink-0">
                        {patient.cubicleNum}
                      </span>
                    )}
                  </div>

                  {patient.elapsedMinutes !== undefined && (
                    <span className="font-mono text-[10px] opacity-80 shrink-0">
                      {patient.elapsedMinutes}m
                    </span>
                  )}
                </button>
              );
            })
          )}

          {stage.patients.length > 10 && (
            <p className="text-center text-[10px] font-semibold text-content-muted pt-1">
              +{stage.patients.length - 10} more in stage
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
