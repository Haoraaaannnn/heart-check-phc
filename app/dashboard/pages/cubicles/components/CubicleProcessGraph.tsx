/**
 * @fileoverview Clean minimal orthogonal process-graph queue visualization.
 *
 * Implements an interactive multi-service stage pipeline with:
 * - Dynamic clinical service blocks synchronized directly with the database `services` table
 *   configured in Superadmin (zero hardcoded services).
 * - Live real-time moving dots that animate strictly when actual patient queue processes occur.
 * - Whole-day queue simulation replay mode ("Simulate Day Flow") to visualize full-day outpatient traffic.
 * - High-capacity room handling: compact responsive grids, internal scrolling, room filter pills,
 *   service-level collapse/expand, and universal search to gracefully support many open rooms and cubicles.
 * - Horizontal and vertical orthogonal connectors with directional arrowheads.
 * - Exact 1:1 pixel coordinate matching between SVG connectors and HTML stage cards.
 * - Dynamic canvas height and bus spine calculation for pixel-perfect orthogonal routing.
 * - Strict prohibition of text ellipsis and truncation (Rule 11 compliance).
 * - On-demand stage detail inspector modal when clicking any stage or cubicle.
 *
 * @module app/dashboard/pages/cubicles/components/CubicleProcessGraph
 */

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CUBICLES_STYLES } from '@/app/dashboard/pages/cubicles/constants/cubicles';
import { CUBICLES_TEXTS } from '@/app/dashboard/pages/cubicles/constants/cubiclesTexts';
import { useCubicleFlowchartData } from '@/app/dashboard/pages/cubicles/hooks/useCubicleFlowchartData';
import { resolveServiceIcon } from '@/constants/icons';
import type {
  FlowchartCubicleStation,
  FlowchartPatientItem,
} from '@/app/dashboard/pages/cubicles/types/cubicle';
import ProcessStageModal, {
  type ProcessStageTarget,
} from '@/app/dashboard/pages/cubicles/components/ProcessStageModal';
import FlowchartInspectionModal from '@/app/dashboard/pages/cubicles/components/FlowchartInspectionModal';

/**
 * Queue item entity representing an active patient in transit.
 */
export interface ActiveTransitPatient {
  id: string;
  patientNum: string;
  service: string;
  targetServiceKey: string;
  targetCubicleNum?: string | null;
  stageFrom: 'waiting' | 'dispatch' | 'service' | 'carryout';
  stageTo: 'dispatch' | 'service' | 'carryout' | 'completed';
  startedAt: number;
  durationMs: number;
  progress: number;
  x: number;
  y: number;
}

/**
 * Extracts a room identifier (e.g. 'R1', 'R2', 'R4') from a cubicle name.
 *
 * @param cubicleNum - Cubicle name string.
 * @returns Room identifier or null.
 */
function extractRoomId(cubicleNum: string): string | null {
  const match = cubicleNum.match(/R(\d+)/i);
  return match ? `R${match[1]}` : null;
}

/** Fixed coordinate board width in pixels. */
const CANVAS_WIDTH = 1440;

/**
 * Clean, minimal process-graph component with dynamic per-service rectangle blocks.
 *
 * @returns JSX element.
 */
export default function CubicleProcessGraph() {
  const S = CUBICLES_STYLES.processGraph;
  const T = CUBICLES_TEXTS.flowchart.processGraph;

  const {
    stages,
    cubicleStations,
    services,
    todayRawPatients,
    loading,
    error,
    refresh,
  } = useCubicleFlowchartData();

  // State for stage detail inspector modal
  const [modalTarget, setModalTarget] = useState<ProcessStageTarget | null>(null);

  // State for deeper patient journey inspection modal
  const [patientInspection, setPatientInspection] = useState<
    FlowchartPatientItem | FlowchartCubicleStation | null
  >(null);

  // Global search query across cubicles, rooms, doctors, or patient tickets
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active room filter per service block (solves high volume of rooms)
  const [activeRoomFilters, setActiveRoomFilters] = useState<Record<string, string>>({});

  // Collapsed state per service block (allows compacting inactive services)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // Transit animation speed multiplier: 1x (normal) or 2x (fast)
  const [animSpeedMultiplier, setAnimSpeedMultiplier] = useState<number>(1);

  // Whole-Day Queue Simulation Replay Mode state
  const [isDaySimulationActive, setIsDaySimulationActive] = useState<boolean>(false);
  const [simPatientIndex, setSimPatientIndex] = useState<number>(0);
  const [simActivePatient, setSimActivePatient] = useState<ActiveTransitPatient | null>(null);

  // Dynamic clinical color palettes applied to services in order of appearance
  const CLINICAL_PALETTES = useMemo(
    () => [
      { badge: S.groupBadgeOpd, accent: 'text-rose-500' },
      { badge: S.groupBadgeSpecialized, accent: 'text-amber-500' },
      { badge: S.groupBadgeWarfarin, accent: 'text-slate-600 dark:text-[#a3a3a3]' },
      { badge: S.groupBadgeSpecialized, accent: 'text-purple-500' },
      { badge: S.groupBadgeEcg, accent: 'text-emerald-500' },
      { badge: S.groupBadgeRefill, accent: 'text-teal-500' },
      { badge: S.groupBadgeBenzathine, accent: 'text-rose-600 dark:text-rose-400' },
      { badge: S.groupBadgeReschedule, accent: 'text-slate-600 dark:text-[#a3a3a3]' },
    ],
    [S]
  );

  /**
   * Dynamically build service blocks directly from the database `services` table.
   * If a service is added, renamed, or customized in Superadmin, it reflects here automatically.
   */
  const serviceBlocks = useMemo(() => {
    return services.map((svc, index) => {
      const palette = CLINICAL_PALETTES[index % CLINICAL_PALETTES.length];
      const sName = svc.label_en.trim();
      const sKey = sName.toLowerCase();

      // Match cubicles assigned to this service
      const stations = cubicleStations.filter(
        (station) => station.category.trim().toLowerCase() === sKey
      );

      return {
        key: sKey,
        rawService: svc,
        title: sName,
        subtitle: '',
        icon: resolveServiceIcon(svc),
        badgeClass: palette.badge,
        accentColor: palette.accent,
        stations,
      };
    });
  }, [services, cubicleStations, CLINICAL_PALETTES]);

  // Service blocks positioning tokens
  const blockWidth = 470;
  const blockStartX = 490;
  const branchBusX = 455;
  const mergeBusX = 1000;
  const blockGap = 16;

  // Compute layout for each service block dynamically based on collapse state
  const serviceLayouts = useMemo(() => {
    let currentY = 35;
    const layouts = [];

    for (const block of serviceBlocks) {
      const isCollapsed = Boolean(collapsedBlocks[block.key]);
      const height = isCollapsed ? 44 : 155;
      const top = currentY;
      const mid = top + height / 2;
      currentY += height + blockGap;

      layouts.push({
        ...block,
        isCollapsed,
        top,
        mid,
        left: blockStartX,
        width: blockWidth,
        height,
      });
    }

    return layouts;
  }, [serviceBlocks, collapsedBlocks, blockStartX, blockWidth, blockGap]);

  // Dynamic canvas height to accommodate all open blocks without clipping
  const CANVAS_HEIGHT = useMemo(() => {
    if (serviceLayouts.length === 0) return 740;
    const lastBlock = serviceLayouts[serviceLayouts.length - 1];
    return Math.max(760, lastBlock.top + lastBlock.height + 45);
  }, [serviceLayouts]);

  const MID_Y = CANVAS_HEIGHT / 2;

  // Coordinate geometry for outer stages centered vertically
  const colWaiting = { x: 25, width: 175, height: 120, y: MID_Y - 60 };
  const colDispatch = { x: 240, width: 170, height: 120, y: MID_Y - 60 };
  const colCarryout = { x: 1045, width: 165, height: 120, y: MID_Y - 60 };
  const colCompleted = { x: 1250, width: 165, height: 120, y: MID_Y - 60 };

  const minBlockMid = serviceLayouts[0]?.mid || 100;
  const maxBlockMid = serviceLayouts[serviceLayouts.length - 1]?.mid || (CANVAS_HEIGHT - 100);

  // Active patients currently in transit along connector routes
  const [transitPatients, setTransitPatients] = useState<ActiveTransitPatient[]>([]);

  // Synchronize LIVE moving dots strictly when actual processes occur in real time
  useEffect(() => {
    // If simulation replay mode is active, defer to the simulation driver
    if (isDaySimulationActive) return;

    const realDispatches = stages.dispatch.patients;

    // Zero moving dots when the live pipeline is idle
    if (realDispatches.length === 0) {
      setTransitPatients([]);
      return;
    }

    const items: ActiveTransitPatient[] = realDispatches.map((p, idx) => {
      const sLower = (p.service || '').trim().toLowerCase();
      const layout =
        serviceLayouts.find((l) => l.key === sLower) ||
        serviceLayouts.find((l) => sLower.includes(l.key)) ||
        serviceLayouts[0];

      return {
        id: `live-${p.id}`,
        patientNum: p.patientNum,
        service: p.service,
        targetServiceKey: layout ? layout.key : 'consultation',
        targetCubicleNum: p.cubicleNum,
        stageFrom: 'dispatch',
        stageTo: 'service',
        startedAt: performance.now() - idx * 400,
        durationMs: 2500 / animSpeedMultiplier,
        progress: 0.5,
        x: branchBusX + 0.5 * (blockStartX - branchBusX),
        y: layout ? layout.mid : MID_Y,
      };
    });

    setTransitPatients(items);
  }, [
    stages.dispatch.patients,
    serviceLayouts,
    branchBusX,
    blockStartX,
    animSpeedMultiplier,
    MID_Y,
    isDaySimulationActive,
  ]);

  /**
   * Whole-Day Queue Simulation Replay Engine
   * Sequentially replays the day's patient traffic through the entire 5-stage lifecycle.
   */
  useEffect(() => {
    if (!isDaySimulationActive) {
      setSimActivePatient(null);
      return;
    }

    // Determine simulation cohort from real day records or representative cohort
    const cohort =
      todayRawPatients.length > 0
        ? todayRawPatients
        : [
            { id: 1, patientNum: 'P-101', service: 'Consultation' },
            { id: 2, patientNum: 'SCR-201', service: 'OPD Screening' },
            { id: 3, patientNum: 'WAR-301', service: 'Warfarin' },
            { id: 4, patientNum: 'ECG-401', service: 'ECG' },
            { id: 5, patientNum: 'CRD-501', service: 'OPD Card' },
            { id: 6, patientNum: 'REF-601', service: 'Refill Prescription' },
          ];

    if (simPatientIndex >= cohort.length) {
      // Completed full day simulation replay
      setIsDaySimulationActive(false);
      setSimPatientIndex(0);
      setSimActivePatient(null);
      return;
    }

    const currentRecord = cohort[simPatientIndex];
    const sLower = (currentRecord.service || 'consultation').trim().toLowerCase();
    const layout =
      serviceLayouts.find((l) => l.key === sLower) ||
      serviceLayouts.find((l) => sLower.includes(l.key)) ||
      serviceLayouts[0];

    const initialItem: ActiveTransitPatient = {
      id: `sim-${currentRecord.id}-${Date.now()}`,
      patientNum: currentRecord.patientNum || `P-${currentRecord.id}`,
      service: currentRecord.service || 'Consultation',
      targetServiceKey: layout ? layout.key : 'consultation',
      targetCubicleNum: currentRecord.cubicleNum,
      stageFrom: 'waiting',
      stageTo: 'dispatch',
      startedAt: performance.now(),
      durationMs: 1800 / animSpeedMultiplier,
      progress: 0,
      x: colWaiting.x + colWaiting.width,
      y: MID_Y,
    };

    setSimActivePatient(initialItem);
    setTransitPatients([initialItem]);
  }, [
    isDaySimulationActive,
    simPatientIndex,
    todayRawPatients,
    serviceLayouts,
    animSpeedMultiplier,
    colWaiting.x,
    colWaiting.width,
    MID_Y,
  ]);

  // High performance animation loop updating active transit items
  useEffect(() => {
    if (transitPatients.length === 0) return;

    let animId: number;
    const tick = () => {
      const now = performance.now();

      setTransitPatients((prevItems) => {
        return prevItems
          .map((item) => {
            const elapsed = now - item.startedAt;
            const progress = Math.min(1, Math.max(0, elapsed / item.durationMs));

            const targetLayout =
              serviceLayouts.find((l) => l.key === item.targetServiceKey) ||
              serviceLayouts[0];
            const targetMid = targetLayout ? targetLayout.mid : MID_Y;

            let curX = item.x;
            let curY = item.y;

            if (item.stageFrom === 'waiting' && item.stageTo === 'dispatch') {
              // Kiosk Exit to Registration Entrance
              curX =
                colWaiting.x +
                colWaiting.width +
                progress * (colDispatch.x - (colWaiting.x + colWaiting.width));
              curY = MID_Y;

              if (progress >= 1) {
                return {
                  ...item,
                  stageFrom: 'dispatch' as const,
                  stageTo: 'service' as const,
                  startedAt: now,
                  durationMs: 2200 / animSpeedMultiplier,
                  progress: 0,
                  x: colDispatch.x + colDispatch.width,
                  y: MID_Y,
                };
              }
            } else if (item.stageFrom === 'dispatch' && item.stageTo === 'service') {
              // Registration Exit to Branch Spine to Assigned Service Block
              const startX = colDispatch.x + colDispatch.width;
              const d1 = branchBusX - startX;
              const d2 = Math.abs(targetMid - MID_Y);
              const d3 = blockStartX - branchBusX;
              const total = d1 + d2 + d3;
              const curDist = progress * total;

              if (curDist <= d1) {
                curX = startX + (curDist / d1) * (branchBusX - startX);
                curY = MID_Y;
              } else if (curDist <= d1 + d2) {
                curX = branchBusX;
                const t2 = d2 === 0 ? 0 : (curDist - d1) / d2;
                curY = MID_Y + t2 * (targetMid - MID_Y);
              } else {
                const t3 = d3 === 0 ? 0 : (curDist - d1 - d2) / d3;
                curX = branchBusX + t3 * (blockStartX - branchBusX);
                curY = targetMid;
              }

              if (progress >= 1) {
                if (isDaySimulationActive) {
                  return {
                    ...item,
                    stageFrom: 'service' as const,
                    stageTo: 'carryout' as const,
                    startedAt: now,
                    durationMs: 2200 / animSpeedMultiplier,
                    progress: 0,
                    x: blockStartX + blockWidth,
                    y: targetMid,
                  };
                }
                return null; // Item enters service block in live mode
              }
            } else if (item.stageFrom === 'service' && item.stageTo === 'carryout') {
              // Nurse Service Block Exit to Merge Spine to Carryout Entrance
              const startX = blockStartX + blockWidth;
              const d1 = mergeBusX - startX;
              const d2 = Math.abs(MID_Y - targetMid);
              const d3 = colCarryout.x - mergeBusX;
              const total = d1 + d2 + d3;
              const curDist = progress * total;

              if (curDist <= d1) {
                curX = startX + (curDist / d1) * (mergeBusX - startX);
                curY = targetMid;
              } else if (curDist <= d1 + d2) {
                curX = mergeBusX;
                const t2 = d2 === 0 ? 0 : (curDist - d1) / d2;
                curY = targetMid + t2 * (MID_Y - targetMid);
              } else {
                const t3 = d3 === 0 ? 0 : (curDist - d1 - d2) / d3;
                curX = mergeBusX + t3 * (colCarryout.x - mergeBusX);
                curY = MID_Y;
              }

              if (progress >= 1) {
                if (isDaySimulationActive) {
                  return {
                    ...item,
                    stageFrom: 'carryout' as const,
                    stageTo: 'completed' as const,
                    startedAt: now,
                    durationMs: 1800 / animSpeedMultiplier,
                    progress: 0,
                    x: colCarryout.x + colCarryout.width,
                    y: MID_Y,
                  };
                }
                return null;
              }
            } else if (item.stageFrom === 'carryout' && item.stageTo === 'completed') {
              // Carryout Exit to Finished Entrance
              curX =
                colCarryout.x +
                colCarryout.width +
                progress * (colCompleted.x - (colCarryout.x + colCarryout.width));
              curY = MID_Y;

              if (progress >= 1) {
                if (isDaySimulationActive) {
                  // Advance to next patient in whole-day simulation
                  setSimPatientIndex((prev) => prev + 1);
                }
                return null; // Item reaches Finished state and is removed from active pipeline
              }
            }

            return {
              ...item,
              x: curX,
              y: curY,
              progress,
            };
          })
          .filter((i): i is ActiveTransitPatient => i !== null);
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    transitPatients.length,
    serviceLayouts,
    colWaiting.x,
    colWaiting.width,
    colDispatch.x,
    colDispatch.width,
    colCarryout.x,
    colCarryout.width,
    colCompleted.x,
    branchBusX,
    mergeBusX,
    blockStartX,
    blockWidth,
    animSpeedMultiplier,
    isDaySimulationActive,
    MID_Y,
  ]);

  // Active status checks for stage indicators
  const isDispatchActive =
    stages.dispatch.count > 0 || transitPatients.some((t) => t.stageTo === 'dispatch');
  const isCarryoutActive = stages.carryout.count > 0;

  /**
   * Toggles collapse state for a specific service block.
   *
   * @param key - Service block key.
   */
  const toggleBlockCollapse = (key: string) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Expands all service blocks.
   */
  const handleExpandAll = () => {
    const updated: Record<string, boolean> = {};
    serviceBlocks.forEach((b) => {
      updated[b.key] = false;
    });
    setCollapsedBlocks(updated);
  };

  /**
   * Collapses service blocks that currently have zero active consultations.
   */
  const handleCollapseInactive = () => {
    const updated: Record<string, boolean> = {};
    serviceBlocks.forEach((block) => {
      const hasActive = block.stations.some((s) => s.status === 'occupied');
      updated[block.key] = !hasActive;
    });
    setCollapsedBlocks(updated);
  };

  /**
   * Starts or stops the whole-day traffic simulation replay.
   */
  const toggleDaySimulation = () => {
    if (isDaySimulationActive) {
      setIsDaySimulationActive(false);
      setSimPatientIndex(0);
      setSimActivePatient(null);
    } else {
      setIsDaySimulationActive(true);
      setSimPatientIndex(0);
    }
  };

  return (
    <div className={S.canvasCard}>
      {/* Canvas Top Bar */}
      <div className={S.canvasHeader}>
        <div className={S.canvasTitleGroup}>
          <div className={S.canvasIconWrap}>
            <i className="bx bx-git-commit" />
          </div>
          <div>
            <h3 className={S.canvasTitle}>{T.title}</h3>
            <p className={S.canvasSubtitle}>{T.subtitle}</p>
          </div>
        </div>

        <div className={S.canvasControls}>
          {/* Universal Search Filter (Solves High Cubicle/Room Volume) */}
          <div className={S.searchContainer}>
            <i className="bx bx-search text-content-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={T.searchPlaceholder}
              className={S.searchInput}
              aria-label={T.searchLabel}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-content-muted hover:text-content text-xs cursor-pointer"
                title={T.clearSearch}
              >
                <i className="bx bx-x" />
              </button>
            )}
          </div>

          {/* Master Expand/Collapse Controls */}
          <button
            type="button"
            onClick={handleExpandAll}
            className={S.dispatchBtn}
            title={T.expandAll}
          >
            <i className="bx bx-expand-vertical" />
            <span>{T.expandAll}</span>
          </button>

          <button
            type="button"
            onClick={handleCollapseInactive}
            className={S.dispatchBtn}
            title={T.collapseAll}
          >
            <i className="bx bx-collapse-vertical" />
            <span>{T.collapseAll}</span>
          </button>

          {/* Whole-Day Traffic Simulation Replay Trigger */}
          <button
            type="button"
            onClick={toggleDaySimulation}
            className={`${S.dispatchBtn} ${
              isDaySimulationActive
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300'
                : ''
            }`}
            title="Replay full operational day queue traffic across all clinical stages"
          >
            <i
              className={`bx ${
                isDaySimulationActive ? 'bx-stop-circle text-rose-500' : 'bx-history text-content-muted'
              }`}
            />
            <span>
              {isDaySimulationActive ? T.stopSimulateBtn : T.simulateDayBtn}
            </span>
          </button>

          {/* Mode Indicator Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-bold text-content shadow-2xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDaySimulationActive
                  ? 'bg-amber-500 animate-pulse'
                  : transitPatients.length > 0
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span>
              {isDaySimulationActive
                ? `${T.simulationModeBadge} (${simPatientIndex + 1})`
                : transitPatients.length > 0
                ? `${transitPatients.length} ${T.inTransit}`
                : T.liveModeBadge}
            </span>
          </span>

          {/* Animation Speed Multiplier Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setAnimSpeedMultiplier(1)}
              className={`${S.speedToggleBtn} ${animSpeedMultiplier === 1 ? S.activeSpeedBtn : ''}`}
            >
              1x
            </button>
            <button
              type="button"
              onClick={() => setAnimSpeedMultiplier(2)}
              className={`${S.speedToggleBtn} ${animSpeedMultiplier === 2 ? S.activeSpeedBtn : ''}`}
            >
              2x
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={refresh}
            className={S.dispatchBtn}
            title="Refresh pipeline data"
          >
            <i className={`bx bx-refresh ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Process Diagram Board */}
      <div className="overflow-x-auto phc-scroll pb-2">
        <div
          className="relative select-none border border-line/50 rounded-xl bg-slate-50/40 dark:bg-[#0d0d0d]/60 m-auto"
          style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        >
          {/* SVG ORTHOGONAL CONNECTORS LAYER */}
          <svg
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className="absolute inset-0 pointer-events-none z-0"
          >
            <defs>
              <marker
                id="ortho-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" className="fill-slate-400 dark:fill-[#52525b]" />
              </marker>

              <marker
                id="ortho-arrow-active"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" className="fill-rose-500" />
              </marker>
            </defs>

            {/* PATH 1: Kiosk to Registration (Horizontal with Arrowhead) */}
            <path
              d={`M ${colWaiting.x + colWaiting.width} ${MID_Y} L ${colDispatch.x} ${MID_Y}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className={
                isDispatchActive
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-slate-300 dark:text-[#3f3f46]'
              }
              markerEnd={
                isDispatchActive ? 'url(#ortho-arrow-active)' : 'url(#ortho-arrow)'
              }
            />

            {/* PATH 2: Registration to Branch Bus Vertical Spine (Horizontal) */}
            <path
              d={`M ${colDispatch.x + colDispatch.width} ${MID_Y} L ${branchBusX} ${MID_Y}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-slate-300 dark:text-[#3f3f46]"
            />

            {/* PATH 2: Branch Bus Vertical Spine (Orthogonal) */}
            <path
              d={`M ${branchBusX} ${minBlockMid} L ${branchBusX} ${maxBlockMid}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-slate-300 dark:text-[#3f3f46]"
            />

            {/* PATH 2: Horizontal Branches into each Service Rectangle Block */}
            {serviceLayouts.map((block) => {
              const hasTravelingPatient = transitPatients.some(
                (item) => item.targetServiceKey === block.key
              );

              return (
                <path
                  key={`branch-${block.key}`}
                  d={`M ${branchBusX} ${block.mid} L ${blockStartX} ${block.mid}`}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  className={
                    hasTravelingPatient
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-300 dark:text-[#3f3f46]'
                  }
                  markerEnd={
                    hasTravelingPatient
                      ? 'url(#ortho-arrow-active)'
                      : 'url(#ortho-arrow)'
                  }
                />
              );
            })}

            {/* PATH 3: Horizontal Lines from each Service Rectangle Block to Merge Spine */}
            {serviceLayouts.map((block) => {
              return (
                <path
                  key={`merge-out-${block.key}`}
                  d={`M ${blockStartX + blockWidth} ${block.mid} L ${mergeBusX} ${block.mid}`}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  className="text-slate-300 dark:text-[#3f3f46]"
                />
              );
            })}

            {/* PATH 3: Merge Bus Vertical Spine (Orthogonal) */}
            <path
              d={`M ${mergeBusX} ${minBlockMid} L ${mergeBusX} ${maxBlockMid}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-slate-300 dark:text-[#3f3f46]"
            />

            {/* PATH 3: Merge Bus into Carryout (Horizontal with Arrowhead) */}
            <path
              d={`M ${mergeBusX} ${MID_Y} L ${colCarryout.x} ${MID_Y}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className={
                isCarryoutActive
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-slate-300 dark:text-[#3f3f46]'
              }
              markerEnd={
                isCarryoutActive ? 'url(#ortho-arrow-active)' : 'url(#ortho-arrow)'
              }
            />

            {/* PATH 4: Carryout to Finished (Horizontal with Arrowhead) */}
            <path
              d={`M ${colCarryout.x + colCarryout.width} ${MID_Y} L ${colCompleted.x} ${MID_Y}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-slate-300 dark:text-[#3f3f46]"
              markerEnd="url(#ortho-arrow)"
            />

            {/* REAL QUEUE MOVING DOTS: Only present when actual patients are in transit */}
            {transitPatients.map((item) => {
              return (
                <g key={item.id} className="cursor-pointer select-none">
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r="8"
                    className="fill-rose-500/20 animate-ping"
                  />
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r="5"
                    className="fill-rose-500 stroke-white dark:stroke-[#1a1a1a]"
                    strokeWidth="1.5"
                  />
                  <g transform={`translate(${item.x}, ${item.y - 12})`}>
                    <rect
                      x="-18"
                      y="-8"
                      width="36"
                      height="13"
                      rx="3"
                      className="fill-slate-900/90 dark:fill-white/95 stroke-line shadow-xs"
                    />
                    <text
                      textAnchor="middle"
                      y="2"
                      className="fill-white dark:fill-[#1a1a1a] font-mono text-[8px] font-extrabold"
                    >
                      {item.patientNum}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* HTML OVERLAY: Rectangular Stage Nodes */}

          {/* STAGE 1: Kiosk */}
          <div
            onClick={() => setModalTarget({ type: 'stage', stage: stages.waiting })}
            className={`${S.nodeCard} ${S.nodeCardIdle}`}
            style={{
              position: 'absolute',
              left: `${colWaiting.x}px`,
              top: `${colWaiting.y}px`,
              width: `${colWaiting.width}px`,
              height: `${colWaiting.height}px`,
            }}
            title={T.clickToInspect}
          >
            <div>
              <div className={S.nodeHeader}>
                <span className={S.nodeTitle}>
                  <i className="bx bx-devices text-amber-500" />
                  <span>{stages.waiting.title}</span>
                </span>
                <span className={`${S.nodeBadge} bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900`}>
                  {stages.waiting.count}
                </span>
              </div>
              <p className="text-[10px] text-content-muted leading-none">
                {stages.waiting.subtitle}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-line/60">
              <span className="text-content-muted">{stages.waiting.metricLabel}:</span>
              <span className="font-mono font-extrabold text-content">
                {stages.waiting.metricValue}
              </span>
            </div>
          </div>

          {/* STAGE 2: Registration */}
          <div
            onClick={() => setModalTarget({ type: 'stage', stage: stages.dispatch })}
            className={`${S.nodeCard} ${
              isDispatchActive ? S.nodeCardProcessing : S.nodeCardIdle
            }`}
            style={{
              position: 'absolute',
              left: `${colDispatch.x}px`,
              top: `${colDispatch.y}px`,
              width: `${colDispatch.width}px`,
              height: `${colDispatch.height}px`,
            }}
            title={T.clickToInspect}
          >
            <div>
              <div className={S.nodeHeader}>
                <span className={S.nodeTitle}>
                  <i className="bx bx-user-check text-[#a8071a] dark:text-[#f87171]" />
                  <span>{stages.dispatch.title}</span>
                </span>
                <span className={`${S.nodeBadge} bg-[#a8071a]/10 text-[#a8071a] dark:text-[#f87171] border-[#a8071a]/30`}>
                  {stages.dispatch.count}
                </span>
              </div>
              <p className="text-[10px] text-content-muted leading-none">
                {stages.dispatch.subtitle}
              </p>
            </div>

            {isDispatchActive ? (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-line/60 text-rose-600 dark:text-rose-400">
                <span className="flex items-center gap-1 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>{T.inTransit}:</span>
                </span>
                <span className="font-mono font-extrabold">
                  {stages.dispatch.patients[0]?.patientNum ||
                    transitPatients[0]?.patientNum ||
                    'Calling'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-line/60">
                <span className="text-content-muted">{stages.dispatch.metricLabel}:</span>
                <span className="font-mono font-extrabold text-content">
                  {stages.dispatch.metricValue}
                </span>
              </div>
            )}
          </div>

          {/* STAGE 3 COLUMN HEADER: 3. Nurse */}
          <div
            style={{
              position: 'absolute',
              left: `${blockStartX}px`,
              top: '10px',
              width: `${blockWidth}px`,
            }}
            className="flex items-center justify-between px-1 text-[11px] font-extrabold text-content uppercase tracking-wider select-none"
          >
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <i className="bx bx-first-aid text-sm" />
              <span>{T.stage3Title}</span>
            </span>
            <span className="text-[10px] font-semibold text-content-muted lowercase">
              {serviceBlocks.length} {T.servicesCountSuffix}
            </span>
          </div>

          {/* STAGE 3: NURSE - DYNAMIC PER-SERVICE RECTANGLE BLOCKS (SYNCHRONIZED WITH SUPERADMIN) */}
          {serviceLayouts.map((block) => {
            const occupiedCount = block.stations.filter(
              (s) => s.status === 'occupied'
            ).length;
            const isProcessing = occupiedCount > 0;
            const currentRoomFilter = activeRoomFilters[block.key] || 'all';

            // Extract all distinct rooms for this service (e.g. ['R1', 'R2', 'R3', 'R4'])
            const availableRooms = Array.from(
              new Set(
                block.stations
                  .map((s) => extractRoomId(s.cubicleNum))
                  .filter((r): r is string => Boolean(r))
              )
            ).sort();

            // Filter cubicles by active room and search query
            const displayedStations = block.stations.filter((station) => {
              if (currentRoomFilter !== 'all') {
                const rId = extractRoomId(station.cubicleNum);
                if (rId !== currentRoomFilter) return false;
              }

              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchesNum = (station.cubicleNum || '').toLowerCase().includes(q);
                const matchesDoc = (station.assignedDoctor || '').toLowerCase().includes(q);
                const matchesCat = (station.category || '').toLowerCase().includes(q);
                const matchesPatient = (station.currentPatient?.patientNum || '')
                  .toLowerCase()
                  .includes(q);
                return matchesNum || matchesDoc || matchesCat || matchesPatient;
              }

              return true;
            });

            if (block.isCollapsed) {
              return (
                <div
                  key={`collapsed-block-${block.key}`}
                  className={S.serviceBlockCollapsed}
                  style={{
                    position: 'absolute',
                    left: `${block.left}px`,
                    top: `${block.top}px`,
                    width: `${block.width}px`,
                    height: `${block.height}px`,
                  }}
                  onClick={() => toggleBlockCollapse(block.key)}
                  title={`${T.expandBlock} - ${block.title}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`${S.serviceBlockTitle} ${block.accentColor}`}>
                        <i className={`bx ${block.icon} text-sm shrink-0`} />
                        <span>{block.title}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={S.serviceBlockBadge}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            occupiedCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                        <span>
                          {occupiedCount}/{block.stations.length}
                        </span>
                      </span>
                      <i className="bx bx-chevron-down text-content-muted text-base" />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`service-block-${block.key}`}
                className={`${S.serviceBlock} ${
                  isProcessing ? S.serviceBlockProcessing : ''
                }`}
                style={{
                  position: 'absolute',
                  left: `${block.left}px`,
                  top: `${block.top}px`,
                  width: `${block.width}px`,
                  height: `${block.height}px`,
                }}
              >
                {/* Service Block Header */}
                <div className={S.serviceBlockHeader}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`${S.serviceBlockTitle} ${block.accentColor}`}>
                      <i className={`bx ${block.icon} text-sm shrink-0`} />
                      <span>{block.title}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Capacity badge */}
                    <span className={S.serviceBlockBadge}>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          occupiedCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      />
                      <span>
                        {occupiedCount}/{block.stations.length} {T.activeConsults}
                      </span>
                    </span>

                    {/* Room filter selector if service has multiple rooms */}
                    {availableRooms.length > 1 && (
                      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar max-w-[150px]">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveRoomFilters((prev) => ({ ...prev, [block.key]: 'all' }))
                          }
                          className={`${S.serviceRoomFilterPill} ${
                            currentRoomFilter === 'all'
                              ? S.serviceRoomFilterActive
                              : S.serviceRoomFilterInactive
                          }`}
                        >
                          {T.allRoomsFilter}
                        </button>
                        {availableRooms.map((rId) => (
                          <button
                            key={rId}
                            type="button"
                            onClick={() =>
                              setActiveRoomFilters((prev) => ({ ...prev, [block.key]: rId }))
                            }
                            className={`${S.serviceRoomFilterPill} ${
                              currentRoomFilter === rId
                                ? S.serviceRoomFilterActive
                                : S.serviceRoomFilterInactive
                            }`}
                          >
                            {rId}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Collapse Button */}
                    <button
                      type="button"
                      onClick={() => toggleBlockCollapse(block.key)}
                      className={S.serviceBlockToggleBtn}
                      title={T.collapseBlock}
                    >
                      <i className="bx bx-chevron-up text-base" />
                    </button>
                  </div>
                </div>

                {/* High-Capacity Responsive Grid with Dedicated Inner Scroll */}
                <div className={S.serviceBlockScrollGrid}>
                  {displayedStations.length === 0 ? (
                    <div className="col-span-2 lg:col-span-3 flex items-center justify-center p-3 text-center text-[10px] text-content-muted border border-dashed border-line rounded-lg">
                      {T.noMatchingCubicles}
                    </div>
                  ) : (
                    displayedStations.map((station) => {
                      const isOccupied = station.status === 'occupied';
                      const elapsed = station.elapsedMinutes || 0;
                      const isStalled = elapsed > 35;

                      return (
                        <div
                          key={station.id}
                          onClick={() => setModalTarget({ type: 'cubicle', station })}
                          className={`${S.cubicleCompactCard} ${
                            isOccupied ? S.cubicleCompactCardOccupied : ''
                          }`}
                          title={T.clickToInspect}
                        >
                          {/* Top: Room & Status */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-content text-[11px] flex items-center gap-1">
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  isOccupied ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span className="break-words">{station.cubicleNum}</span>
                            </span>

                            {isOccupied ? (
                              <span className="font-mono text-[9px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1 py-0.2 rounded border border-rose-200 dark:border-rose-900 shrink-0">
                                {elapsed}m
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                {T.idleStation}
                              </span>
                            )}
                          </div>

                          {/* Bottom: Doctor & Active Ticket */}
                          <div className="flex items-center justify-between text-[9px] text-content-muted pt-0.5 mt-0.5 border-t border-line/60">
                            <span className={S.cubicleDoctorName}>
                              {station.assignedDoctor
                                ? `Dr. ${station.assignedDoctor.replace(/^Dr\.\s*/i, '')}`
                                : 'Ready'}
                            </span>
                            {isOccupied && station.currentPatient ? (
                              <span
                                className={`font-mono font-bold shrink-0 ${
                                  isStalled ? 'text-rose-600 animate-pulse' : 'text-content'
                                }`}
                              >
                                {station.currentPatient.patientNum}
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] text-content-muted shrink-0">
                                {station.idleMinutes || 0}m idle
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* STAGE 4: Carryout */}
          <div
            onClick={() => setModalTarget({ type: 'stage', stage: stages.carryout })}
            className={`${S.nodeCard} ${
              isCarryoutActive ? S.nodeCardProcessing : S.nodeCardIdle
            }`}
            style={{
              position: 'absolute',
              left: `${colCarryout.x}px`,
              top: `${colCarryout.y}px`,
              width: `${colCarryout.width}px`,
              height: `${colCarryout.height}px`,
            }}
            title={T.clickToInspect}
          >
            <div>
              <div className={S.nodeHeader}>
                <span className={S.nodeTitle}>
                  <i className="bx bx-file-find text-purple-500" />
                  <span>{stages.carryout.title}</span>
                </span>
                <span className={`${S.nodeBadge} bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900`}>
                  {stages.carryout.count}
                </span>
              </div>
              <p className="text-[10px] text-content-muted leading-none">
                {stages.carryout.subtitle}
              </p>
            </div>

            {isCarryoutActive ? (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-line/60 text-purple-600 dark:text-purple-400">
                <span className="flex items-center gap-1 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span>{T.activeProcessing}:</span>
                </span>
                <span className="font-mono font-extrabold">
                  {stages.carryout.patients[0]?.patientNum || 'Post-Exam'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-line/60">
                <span className="text-content-muted">{stages.carryout.metricLabel}:</span>
                <span className="font-mono font-extrabold text-content">
                  {stages.carryout.metricValue}
                </span>
              </div>
            )}
          </div>

          {/* STAGE 5: Finished */}
          <div
            onClick={() => setModalTarget({ type: 'stage', stage: stages.completed })}
            className={`${S.nodeCard} ${S.nodeCardIdle}`}
            style={{
              position: 'absolute',
              left: `${colCompleted.x}px`,
              top: `${colCompleted.y}px`,
              width: `${colCompleted.width}px`,
              height: `${colCompleted.height}px`,
            }}
            title={T.clickToInspect}
          >
            <div>
              <div className={S.nodeHeader}>
                <span className={S.nodeTitle}>
                  <i className="bx bx-check-double text-emerald-500" />
                  <span>{stages.completed.title}</span>
                </span>
                <span className={`${S.nodeBadge} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900`}>
                  {stages.completed.count}
                </span>
              </div>
              <p className="text-[10px] text-content-muted leading-none">
                {stages.completed.subtitle}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-line/60">
              <span className="text-content-muted">{stages.completed.metricLabel}:</span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {stages.completed.count} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Detail Inspector Modal Dialog (Opens on-demand when any stage is clicked) */}
      <ProcessStageModal
        target={modalTarget}
        onClose={() => setModalTarget(null)}
        onSelectPatient={(p) => setPatientInspection(p)}
      />

      {/* Deep Patient Journey Inspection Dialog */}
      <FlowchartInspectionModal
        target={patientInspection}
        onClose={() => setPatientInspection(null)}
      />
    </div>
  );
}
