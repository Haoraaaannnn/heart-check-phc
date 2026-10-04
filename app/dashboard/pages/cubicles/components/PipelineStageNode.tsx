/**
 * @fileoverview Rectangular processing stage node component on the queue process map.
 *
 * Visualizes a discrete clinical queue stage (Waiting, Dispatch, Examination, Carryout, Completed)
 * as a rectangular processing node with input/output connection ports, capacity badges,
 * operational telemetry metrics, and interactive queue buffer slots.
 *
 * @module app/dashboard/pages/cubicles/components/PipelineStageNode
 */

'use client';

import {
  CUBICLES_STYLES,
  PIPELINE_STAGE_STYLES,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import type {
  FlowchartStageData,
  FlowchartPatientItem,
  PipelineStageKey,
} from '@/app/dashboard/pages/cubicles/types/cubicle';

interface PipelineStageNodeProps {
  /** The stage data model containing count, metrics, and patient lists. */
  stage: FlowchartStageData;
  /** Whether this stage is currently selected/highlighted by the user. */
  isSelected: boolean;
  /** Click callback to focus/inspect this stage. */
  onClick: () => void;
  /** Optional callback triggered when a specific patient ticket chip is clicked. */
  onSelectPatient?: (patient: FlowchartPatientItem) => void;
}

const STAGE_NUMBERS: Record<PipelineStageKey, string> = {
  waiting: 'STAGE 01',
  dispatch: 'STAGE 02',
  examination: 'STAGE 03',
  carryout: 'STAGE 04',
  completed: 'STAGE 05',
};

/**
 * Rectangular processing stage node representing a queue processing stop.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function PipelineStageNode({
  stage,
  isSelected,
  onClick,
  onSelectPatient,
}: PipelineStageNodeProps) {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart.transitions;
  const style = PIPELINE_STAGE_STYLES[stage.key];
  const stageNumber = STAGE_NUMBERS[stage.key];

  return (
    <div className={S.stageNodeWrap}>
      {/* Rectangular Processing Stage Node Card */}
      <div
        onClick={onClick}
        className={`${S.stageNodeCard} ${style.border} ${
          isSelected ? S.stageNodeCardActive : ''
        }`}
        title={`Click to focus ${stage.title} (${stage.count} patients)`}
      >
        {/* Terminal Connection Ports (Left = Incoming, Right = Outgoing) */}
        {stage.key !== 'waiting' && (
          <div className={S.nodePortIn} title="Incoming Queue Route Port">
            <span className={`${S.nodePortDot} bg-slate-400 dark:bg-[#52525b]`} />
          </div>
        )}
        {stage.key !== 'completed' && (
          <div className={S.nodePortOut} title="Outgoing Queue Route Port">
            <span className={`${S.nodePortDot} ${style.badgeBg}`} />
          </div>
        )}

        {/* Node Top Header */}
        <div className={S.nodeHeader}>
          <span
            className={`${S.nodeStagePill} ${style.metricBg} ${style.metricBorder} text-content-muted`}
          >
            {stageNumber}
          </span>
          <span
            className={`${S.nodeCountBadge} ${style.badgeBg} ${style.badgeText}`}
          >
            {stage.count} {stage.key === 'completed' ? 'Served' : 'Queued'}
          </span>
        </div>

        {/* Stage Identity Row */}
        <div className={S.nodeIdentity}>
          <div className={`${S.nodeIconWrap} ${style.iconBg} ${style.iconText}`}>
            <i className={`bx ${stage.icon}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className={S.nodeTitle}>{stage.title}</h4>
            <span className={S.nodeSubtitle}>{stage.subtitle}</span>
          </div>
        </div>

        {/* Primary Operational Metric */}
        <div
          className={`${S.nodeMetricStrip} ${style.metricBg} ${style.metricBorder}`}
        >
          <span className="text-[10px] font-semibold text-content-muted">
            {stage.metricLabel}:
          </span>
          <span className="font-mono text-xs font-extrabold text-content">
            {stage.metricValue}
          </span>
        </div>

        {/* Queue Buffer Section (Internal processing slots) */}
        <div className={S.nodeQueueBuffer}>
          <div className={S.nodeQueueHeader}>
            <span>{T.queueBuffer}</span>
            <span className="font-mono text-[9px] text-content-subtle">
              {stage.patients.length > 0 ? `${stage.patients.length} Live` : 'Idle'}
            </span>
          </div>

          {stage.patients.length === 0 ? (
            <div className={S.nodeEmptyBuffer}>
              <span>{T.stationReady}</span>
            </div>
          ) : (
            stage.patients.slice(0, 2).map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPatient?.(patient);
                }}
                className={`${S.nodeTicketItem} ${style.pillBorder} ${style.pillText}`}
                title={`Click to inspect ticket ${patient.patientNum}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <i className="bx bx-user text-[10px] opacity-75 shrink-0" />
                  <span className="truncate">{patient.patientNum}</span>
                </div>
                {patient.elapsedMinutes !== undefined && (
                  <span className="font-mono text-[10px] opacity-80 shrink-0">
                    {patient.elapsedMinutes}m
                  </span>
                )}
              </button>
            ))
          )}

          {stage.patients.length > 2 && (
            <span className="text-center text-[9px] font-semibold text-content-muted pt-0.5">
              +{stage.patients.length - 2} {T.moreInQueue}
            </span>
          )}
        </div>

        {/* Alert Banner for Overdue / Prolonged Patients */}
        {stage.alertCount !== undefined && stage.alertCount > 0 && (
          <div className={S.nodeAlertBanner}>
            <i className="bx bx-alarm-exclamation text-xs shrink-0" />
            <span>
              {stage.alertCount} {T.overdueAlert}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
