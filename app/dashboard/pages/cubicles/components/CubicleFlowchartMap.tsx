/**
 * @fileoverview Main orchestrating component for the Outpatient Cubicle Pipeline Flowchart.
 *
 * Implements an interactive flowchart map visualizing the 5-stage patient journey,
 * live examination room telemetry, consultation processing speed ratings, and turnaround idle intervals.
 * Follows the Stage Pipeline Map mental model with direct branching examination cubicle stations.
 *
 * @module app/dashboard/pages/cubicles/components/CubicleFlowchartMap
 */

'use client';

import { useState, useMemo } from 'react';
import DashboardCard from '@/app/dashboard/components/DashboardCard';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import { useCubicleFlowchartData } from '@/app/dashboard/pages/cubicles/hooks/useCubicleFlowchartData';
import type {
  PipelineStageKey,
  FlowchartPatientItem,
} from '@/app/dashboard/pages/cubicles/types/cubicle';
import FlowchartSummaryBar from '@/app/dashboard/pages/cubicles/components/FlowchartSummaryBar';
import PipelineStageNode from '@/app/dashboard/pages/cubicles/components/PipelineStageNode';
import PipelineConnector from '@/app/dashboard/pages/cubicles/components/PipelineConnector';
import BranchingStationBays from '@/app/dashboard/pages/cubicles/components/BranchingStationBays';
import FlowchartIdleTelemetry from '@/app/dashboard/pages/cubicles/components/FlowchartIdleTelemetry';
import FlowchartInspectionModal from '@/app/dashboard/pages/cubicles/components/FlowchartInspectionModal';

/**
 * Interactive flowchart map visualizing patient progression across cubicle stages.
 *
 * @returns JSX element.
 */
export default function CubicleFlowchartMap() {
  const S = CUBICLES_STYLES.flowchart;
  const T = CUBICLES_TEXTS.flowchart;

  const [selectedStageKey, setSelectedStageKey] = useState<PipelineStageKey | 'all'>('all');

  const {
    stages,
    cubicleStations,
    kpis,
    currentTime,
    loading,
    error,
    selectedInspection,
    setSelectedInspection,
    refresh,
  } = useCubicleFlowchartData();

  // Route 1 items: Patients called from waiting and currently in transit to dispatch
  const route1Items = stages.dispatch.patients;

  // Route 2 items: Patients transitioning from dispatch into assigned examination cubicles
  const route2Items = useMemo(() => {
    const inTransitToRoom = stages.dispatch.patients.filter((p) => Boolean(p.cubicleNum));
    const enteringExam = stages.examination.patients.filter(
      (p) => (p.elapsedMinutes || 0) <= 4
    );
    const map = new Map<number, FlowchartPatientItem>();
    [...inTransitToRoom, ...enteringExam].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [stages.dispatch.patients, stages.examination.patients]);

  // Route 3 items: Patients who completed exam and are transitioning to carryout & prescriptions
  const route3Items = stages.carryout.patients;

  // Route 4 items: Patients actively discharging from carryout into completed records
  const route4Items = useMemo(() => {
    return stages.completed.patients.slice(0, 4);
  }, [stages.completed.patients]);

  return (
    <DashboardCard
      title={T.title}
      subtitle={T.subtitle}
      icon="bx-git-merge"
      className="w-full"
    >
      <div className={S.container}>
        {/* Top Summary KPI Bar */}
        <FlowchartSummaryBar
          kpis={kpis}
          currentTime={currentTime}
          onRefresh={refresh}
          isLoading={loading}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Interactive Stage Flowchart Map Canvas */}
        <div className={S.mapCanvas}>
          {/* Top Bar with Stage Filter Pills & Status */}
          <div className={S.mapTopNav}>
            <div>
              <h3 className="text-sm font-extrabold text-content flex items-center gap-2">
                <i className="bx bx-map-pin text-rose-500" />
                <span>{T.map.title}</span>
              </h3>
              <p className="text-xs text-content-muted mt-0.5">
                {T.map.subtitle}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedStageKey('all')}
                className={`${S.filterPillBase} ${
                  selectedStageKey === 'all'
                    ? S.filterPillActive
                    : S.filterPillInactive
                }`}
              >
                <span>{T.map.filterAll}</span>
              </button>

              {(['waiting', 'dispatch', 'examination', 'carryout', 'completed'] as const).map(
                (key) => {
                  const stage = stages[key];
                  const isSelected = selectedStageKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedStageKey(isSelected ? 'all' : key)
                      }
                      className={`${S.filterPillBase} ${
                        isSelected
                          ? S.filterPillActive
                          : S.filterPillInactive
                      }`}
                    >
                      <i className={`bx ${stage.icon} text-xs`} />
                      <span>{stage.title}</span>
                      <span className="font-mono text-[10px] opacity-80">
                        ({stage.count})
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Main Horizontal Pipeline Track */}
          <div className={S.pipelineTrackWrap}>
            <div className={S.pipelineTrack}>
              <div className={S.pipelinePipe} />
              <div className={S.pipelinePipeActive} />

              {/* Stage 1: Kiosk */}
              <PipelineStageNode
                stage={stages.waiting}
                isSelected={selectedStageKey === 'waiting'}
                onClick={() =>
                  setSelectedStageKey((k) => (k === 'waiting' ? 'all' : 'waiting'))
                }
                onSelectPatient={setSelectedInspection}
              />

              {/* Transition 1 -> 2: Call Next Route */}
              <PipelineConnector
                routeCode="R-01"
                label={T.transitions.t1}
                items={route1Items}
                targetMinutes={5}
                onSelectPatient={setSelectedInspection}
              />

              {/* Stage 2: Registration */}
              <PipelineStageNode
                stage={stages.dispatch}
                isSelected={selectedStageKey === 'dispatch'}
                onClick={() =>
                  setSelectedStageKey((k) => (k === 'dispatch' ? 'all' : 'dispatch'))
                }
                onSelectPatient={setSelectedInspection}
              />

              {/* Transition 2 -> 3: Enter Room Route */}
              <PipelineConnector
                routeCode="R-02"
                label={T.transitions.t2}
                items={route2Items}
                targetMinutes={5}
                onSelectPatient={setSelectedInspection}
              />

              {/* Stage 3: Nurse */}
              <PipelineStageNode
                stage={stages.examination}
                isSelected={selectedStageKey === 'examination'}
                onClick={() =>
                  setSelectedStageKey((k) =>
                    k === 'examination' ? 'all' : 'examination'
                  )
                }
                onSelectPatient={setSelectedInspection}
              />

              {/* Transition 3 -> 4: Exam Done Route */}
              <PipelineConnector
                routeCode="R-03"
                label={T.transitions.t3}
                items={route3Items}
                targetMinutes={10}
                onSelectPatient={setSelectedInspection}
              />

              {/* Stage 4: Carryout */}
              <PipelineStageNode
                stage={stages.carryout}
                isSelected={selectedStageKey === 'carryout'}
                onClick={() =>
                  setSelectedStageKey((k) => (k === 'carryout' ? 'all' : 'carryout'))
                }
                onSelectPatient={setSelectedInspection}
              />

              {/* Transition 4 -> 5: Discharged Route */}
              <PipelineConnector
                routeCode="R-04"
                label={T.transitions.t4}
                items={route4Items}
                targetMinutes={5}
                onSelectPatient={setSelectedInspection}
              />

              {/* Stage 5: Finished */}
              <PipelineStageNode
                stage={stages.completed}
                isSelected={selectedStageKey === 'completed'}
                onClick={() =>
                  setSelectedStageKey((k) => (k === 'completed' ? 'all' : 'completed'))
                }
                onSelectPatient={setSelectedInspection}
              />
            </div>
          </div>

          {/* Stage Focus Patient Tray (Shown when an individual non-exam stage is clicked) */}
          {selectedStageKey !== 'all' && selectedStageKey !== 'examination' && (
            <div className={S.stageTray}>
              <div className={S.stageTrayHeader}>
                <div className={S.stageTrayTitle}>
                  <i className={`bx ${stages[selectedStageKey].icon} text-base text-rose-500`} />
                  <span>
                    {stages[selectedStageKey].title} &mdash;{' '}
                    {stages[selectedStageKey].count} {T.map.showingTickets}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStageKey('all')}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-content-muted hover:text-content hover:bg-surface-subtle transition cursor-pointer"
                >
                  {T.map.viewAllStages}
                </button>
              </div>

              {stages[selectedStageKey].patients.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-line bg-surface/50 text-xs text-content-muted">
                  {T.map.noPatientsInStage}
                </div>
              ) : (
                <div className={S.stageTrayGrid}>
                  {stages[selectedStageKey].patients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedInspection(patient)}
                      className={S.stageTrayCard}
                      title={T.map.inspectTicketHint}
                    >
                      <div className="flex flex-col gap-0.5 truncate">
                        <div className="flex items-center gap-1.5 font-mono font-extrabold text-content">
                          <i className="bx bx-user text-rose-500 text-xs" />
                          <span>{patient.patientNum}</span>
                        </div>
                        <span className="text-[10px] text-content-muted truncate">
                          {patient.service}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {patient.elapsedMinutes !== undefined && (
                          <span className="font-mono text-xs font-bold text-content">
                            {patient.elapsedMinutes}m
                          </span>
                        )}
                        {patient.isStalled && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Stalled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Visual Branch Stem connecting Stage 3 to Physical Bays */}
          {(selectedStageKey === 'all' || selectedStageKey === 'examination') && (
            <div className={S.branchStem}>
              <div className={S.branchStemLine} />
              <div className={S.branchStemBadge}>
                <i className="bx bx-git-branch text-xs text-rose-500" />
                <span>{T.map.branchStem}</span>
                <i className="bx bx-down-arrow-alt text-xs text-rose-500" />
              </div>
              <div className={S.branchStemLine} />
            </div>
          )}

          {/* Branching Examination Station Bays */}
          {(selectedStageKey === 'all' || selectedStageKey === 'examination') && (
            <BranchingStationBays
              stations={cubicleStations}
              onSelectStation={setSelectedInspection}
            />
          )}

          {/* Idle Downtime & Room Turnaround Telemetry */}
          <FlowchartIdleTelemetry
            stations={cubicleStations}
            facilityAvgIdle={kpis.facilityAvgIdleMinutes}
          />
        </div>

        {/* Inspection Modal Dialog */}
        <FlowchartInspectionModal
          target={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      </div>
    </DashboardCard>
  );
}
