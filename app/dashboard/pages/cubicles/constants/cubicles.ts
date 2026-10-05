/**
 * @fileoverview Style tokens, status visual dictionaries, and configuration constants
 * for the Cubicles dashboard page.
 *
 * Adheres strictly to the architectural standards defined in AGENTS.md, ensuring
 * all layout classes, theme tokens, color maps, and dimensional constants are
 * completely decoupled from JSX markup.
 *
 * @module app/dashboard/pages/cubicles/constants/cubicles
 */

import type {
  CubicleStatus,
  SpeedRating,
  IdleRating,
  HeatmapViewMode,
  PipelineStageKey,
} from '@/app/dashboard/pages/cubicles/types/cubicle';

/** Auto-refresh interval for cubicle data queries (30 seconds). */
export const CUBICLES_REFRESH_INTERVAL_MS = 30000;

/** Clock tick update interval for elapsed times (60 seconds). */
export const CUBICLES_CLOCK_INTERVAL_MS = 60000;

/** Assumed average consultation time in minutes when calculating estimated end. */
export const AVG_CONSULTATION_MINUTES = 20;

/** Operational hours defining the clinical throughput schedule across the day. */
export const OPERATIONAL_HOURS: readonly string[] = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
] as const;

/** Consultation processing speed thresholds in minutes. */
export const HEATMAP_SPEED_THRESHOLDS = {
  /** Consultations under 15 minutes are categorized as Fast / High Throughput. */
  fastMax: 15,
  /** Consultations between 15 and 25 minutes are categorized as Optimal standard pace. */
  optimalMax: 25,
  /** Consultations between 25 and 35 minutes are categorized as Moderate complexity. */
  moderateMax: 35,
} as const;

/** Idle downtime thresholds in minutes per 60-minute window. */
export const HEATMAP_IDLE_THRESHOLDS = {
  /** Idle time under 10 minutes indicates continuous near-100% capacity utilization. */
  continuousMax: 10,
  /** Idle time between 10 and 25 minutes indicates low idle (standard flow). */
  lowIdleMax: 25,
  /** Idle time between 25 and 40 minutes indicates moderate idle downtime. */
  moderateIdleMax: 40,
  /** Idle time between 40 and 55 minutes indicates high idle / underutilization. */
  highIdleMax: 55,
} as const;


/** Styling tokens specific to the Cubicles page. */
export const CUBICLES_STYLES = {
  /** Outer page wrapper matching the admin dashboard shell. */
  page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',

  /** Top banner / header region. */
  header: {
    root: 'flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6 shadow-sm md:flex-row md:items-center md:justify-between',
    titleBlock: 'flex flex-col',
    title: 'text-2xl md:text-3xl font-extrabold text-content',
    subtitle: 'text-sm text-content-muted',
    timestamp: 'text-xs font-semibold text-content-subtle',
  },

  /** 4-column metric cards grid. */
  metricsGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',

  /** Metric card style tokens matching DashboardMetrics. */
  metricCard: {
    tile: 'flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5',
    iconWrap: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
    content: 'flex flex-col min-w-0 flex-1',
    label: 'text-xs font-semibold text-content-muted',
    value: 'text-3xl font-extrabold leading-tight text-content',
    subtitle: 'mt-0.5 text-xs text-content-subtle',
  },

  /** Grid of cubicle tiles (4 columns on large screens). */
  cubiclesGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',

  /** Individual cubicle status card. */
  cubicleCard: {
    tile: 'flex flex-col justify-between rounded-xl border-2 p-5 shadow-sm transition hover:shadow-md',
    headerRow: 'flex items-center justify-between mb-3',
    number: 'text-lg font-extrabold text-content',
    statusBadge: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase',
    body: 'flex flex-col gap-1.5 text-xs',
    category: 'font-semibold text-content-muted capitalize',
    detailRow: 'flex items-center gap-1.5 text-content-muted',
    detailValue: 'font-bold text-content',
    timeText: 'font-mono text-content-muted',
    remainingPill:
      'inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
  },

  /** Status legend card. */
  legend: {
    container: 'flex flex-wrap items-center gap-6 pt-2',
    item: 'flex items-center gap-2 text-xs font-semibold text-content-muted',
    dot: 'h-3 w-3 rounded-full',
  },

  /** Heatmap section styles adhering to enterprise solid surface specifications. */
  heatmap: {
    container: 'flex flex-col gap-5',
    headerActions: 'flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line',
    controlsGroup: 'flex flex-wrap items-center gap-2.5',
    viewModeTabs: 'inline-flex items-center rounded-xl border border-line bg-surface-subtle p-1 shadow-2xs',
    viewModeButton:
      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer select-none',
    viewModeButtonActive:
      'bg-white dark:bg-[#1a1a1a] text-[#a8071a] dark:text-[#f87171] shadow-xs font-bold border border-line',
    viewModeButtonInactive:
      'text-content-muted hover:text-content hover:bg-surface/60 border border-transparent',
    dateSelectorWrap: 'flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 shadow-2xs',
    dateLabel: 'text-xs font-bold text-content-muted flex items-center gap-1.5 shrink-0',
    dateSelect:
      'bg-transparent text-xs font-semibold text-content focus:outline-hidden cursor-pointer pr-1 dark:bg-[#1a1a1a]',
    liveBadge:
      'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    liveDot: 'h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse',
    operationalHoursPill:
      'inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-[#242424] px-2 py-0.5 text-[11px] font-medium text-content-muted',

    // KPI summary row
    kpiGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
    kpiCard:
      'flex items-center gap-3.5 rounded-xl border border-line bg-surface p-4 shadow-2xs transition hover:shadow-xs',
    kpiIconWrap: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl',
    kpiLabel: 'text-[11px] font-semibold text-content-muted',
    kpiValue: 'text-xl font-extrabold text-content',
    kpiSubtitle: 'text-[10px] text-content-subtle',

    // Table / matrix
    tableWrap: 'w-full overflow-x-auto rounded-xl border border-line bg-surface phc-scroll shadow-xs',
    table: 'w-full border-collapse text-left text-xs',
    thRow: 'border-b border-line bg-surface-subtle/80 text-[11px] font-bold text-content-muted tracking-wider uppercase',
    thCubicle:
      'sticky left-0 z-20 min-w-[200px] border-r border-line bg-surface p-3 shadow-[2px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]',
    thHour: 'min-w-[100px] p-2.5 text-center font-mono font-bold text-content-muted border-r border-line/60',
    thHourCurrent:
      'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    thSummary:
      'sticky right-0 z-20 min-w-[150px] border-l border-line bg-surface p-3 text-center shadow-[-2px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[-2px_0_4px_rgba(0,0,0,0.2)]',

    // Body rows
    tr: 'border-b border-line/70 transition-colors hover:bg-surface-subtle/50',
    tdCubicle:
      'sticky left-0 z-10 border-r border-line bg-surface p-3 shadow-[2px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]',
    cubicleNum: 'font-extrabold text-content text-sm flex items-center gap-1.5',
    cubicleCategory: 'text-[10px] font-medium text-content-subtle capitalize break-words max-w-[160px]',
    cubicleDoctor: 'text-[10px] text-content-muted break-words max-w-[160px] flex items-center gap-1 mt-0.5',
    tdCell: 'p-1.5 border-r border-line/50 text-center align-middle',
    tdSummary:
      'sticky right-0 z-10 border-l border-line bg-surface p-2.5 text-center shadow-[-2px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[-2px_0_4px_rgba(0,0,0,0.2)]',

    // Cell button
    cellButton:
      'group relative flex flex-col items-center justify-center w-full min-h-[54px] rounded-lg border p-1 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/30 hover:scale-[1.03] hover:shadow-xs',
    cellPrimaryValue: 'font-mono text-xs font-extrabold leading-tight',
    cellSecondaryValue: 'font-mono text-[10px] font-medium leading-none opacity-85 mt-0.5',
    cellBadge: 'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-1',
    cellUpcoming:
      'opacity-40 bg-slate-50 dark:bg-[#1a1a1a] border-dashed border-line cursor-not-allowed hover:scale-100 hover:shadow-none',

    // Summary row
    tfRow: 'border-t-2 border-line bg-surface-subtle/90 font-bold',
    tfCubicle:
      'sticky left-0 z-20 border-r border-line bg-surface p-3 font-bold text-content text-xs shadow-[2px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]',
    tfHour: 'p-2 border-r border-line/60 text-center font-mono text-xs text-content',
    tfSummary:
      'sticky right-0 z-20 border-l border-line bg-surface p-2.5 text-center text-xs font-extrabold text-content shadow-[-2px_0_4px_rgba(0,0,0,0.03)] dark:shadow-[-2px_0_4px_rgba(0,0,0,0.2)]',

    // Legend
    legendWrap: 'flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-2xs',
    legendHeader: 'flex items-center justify-between',
    legendTitle: 'text-xs font-bold text-content',
    legendSubtitle: 'text-[11px] text-content-muted',
    legendScale: 'flex flex-wrap items-center gap-3',
    legendItem: 'flex items-center gap-1.5 text-xs text-content-muted',
    legendSwatch: 'h-3.5 w-6 rounded border shadow-2xs',

    // Modal
    modalBackdrop:
      'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs transition-opacity',
    modalCard: 'w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl transition-all',
    modalHeader: 'flex items-start justify-between border-b border-line pb-4',
    modalTitle: 'text-lg font-bold text-content',
    modalSubtitle: 'text-xs text-content-muted mt-0.5',
    modalCloseBtn:
      'rounded-lg p-1.5 text-content-muted hover:bg-surface-subtle hover:text-content transition cursor-pointer',
    modalBody: 'flex flex-col gap-4 pt-4 max-h-[70vh] overflow-y-auto phc-scroll',
    modalStatGrid: 'grid grid-cols-2 gap-3 sm:grid-cols-4',
    modalStatCard: 'rounded-xl border border-line bg-surface-subtle p-3 text-center',
    modalStatLabel: 'text-[10px] font-semibold text-content-muted uppercase',
    modalStatValue: 'text-base font-extrabold text-content mt-0.5',
    modalPatientList: 'flex flex-col gap-2',
    modalPatientRow: 'flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs',
  },

  /** Flowchart Stage Map styling tokens adhering to enterprise solid surface specifications. */
  flowchart: {
    container: 'flex flex-col gap-6',
    summaryBar:
      'flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs md:p-5',
    summaryPillGroup: 'flex flex-wrap items-center gap-4 sm:gap-6',
    summaryPill: 'flex items-center gap-3',
    summaryIconWrap:
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold shadow-2xs',
    summaryLabel: 'text-[11px] font-semibold text-content-muted leading-none',
    summaryValue: 'font-mono text-xl font-extrabold text-content mt-1 leading-tight',
    summarySubtext: 'text-[10px] text-content-subtle mt-0.5',
    pipelineWrap: 'w-full overflow-x-auto pb-4 pt-1 phc-scroll',
    pipelineRow: 'flex items-stretch gap-2.5 min-w-[1180px] justify-between relative',
    stageCard:
      'flex-1 flex flex-col rounded-2xl border-2 p-4 shadow-xs transition-all hover:shadow-md min-w-[210px] max-w-[260px]',
    stageHeader: 'flex items-center justify-between pb-3 border-b mb-3',
    stageTitleGroup: 'flex items-center gap-2.5 min-w-0',
    stageIconWrap:
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg shadow-2xs',
    stageTitle: 'text-sm font-extrabold text-content leading-tight break-words',
    stageSubtitle: 'text-[10px] text-content-muted leading-none mt-0.5 break-words',
    stageBadge:
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-bold shrink-0',
    stageBody: 'flex-1 flex flex-col justify-between gap-3',
    stageMetricStrip:
      'flex items-center justify-between rounded-xl px-3 py-2 text-xs border',
    stagePatientList: 'flex flex-col gap-1.5 max-h-[140px] overflow-y-auto phc-scroll pr-1',
    patientPill:
      'flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-mono font-bold transition hover:scale-[1.02] cursor-pointer shadow-2xs',
    connector: 'flex flex-col items-center justify-center shrink-0 w-8 self-center text-center',
    connectorCircle:
      'flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-content-muted shadow-xs text-base',
    connectorText:
      'text-[8px] font-bold text-content-subtle uppercase tracking-wider mt-1 text-center',
    hubCard: 'flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-xs gap-4',
    hubHeader: 'flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line',
    hubTitleGroup: 'flex items-center gap-3',
    hubTitleIcon:
      'flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xl border border-rose-200 dark:border-rose-900',
    hubTitle: 'text-base font-extrabold text-content',
    hubSubtitle: 'text-xs text-content-muted',
    stationGrid: 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4',
    stationCard:
      'group flex flex-col justify-between rounded-xl border-2 p-4 shadow-xs transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer',
    telemetryStrip:
      'flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs',
    telemetryHeader: 'flex items-center justify-between',
    telemetryTitle: 'text-xs font-bold text-content flex items-center gap-2',
    telemetryBar: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
    telemetryTile: 'flex items-center justify-between rounded-xl border p-3 text-xs',

    // Interactive Node-Pipeline Map Tokens
    mapCanvas:
      'relative flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 shadow-xs overflow-hidden',
    mapTopNav: 'flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line',
    pipelineTrackWrap: 'w-full overflow-x-auto pb-4 pt-2 phc-scroll',
    pipelineTrack:
      'relative flex items-center justify-between gap-1 min-w-[1380px] py-4 px-2',
    pipelinePipe:
      'absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-slate-200 dark:bg-[#2e2e2e] -z-0',
    pipelinePipeActive:
      'absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-500 opacity-25 -z-0',

    // Rectangular processing stage node tokens
    stageNodeWrap: 'relative z-10 flex flex-col items-center select-none shrink-0',
    stageNodeCard:
      'group flex flex-col w-[250px] rounded-2xl border-2 p-3.5 shadow-xs transition-all hover:shadow-md cursor-pointer relative bg-surface',
    stageNodeCardActive: 'ring-3 ring-rose-500/50 shadow-md scale-[1.02] border-rose-500',
    nodePortIn:
      'absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-line bg-surface flex items-center justify-center shadow-xs z-20',
    nodePortOut:
      'absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-line bg-surface flex items-center justify-center shadow-xs z-20',
    nodePortDot: 'w-1.5 h-1.5 rounded-full bg-rose-500',
    nodeHeader: 'flex items-center justify-between pb-2 border-b border-line/60',
    nodeStagePill: 'font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
    nodeCountBadge: 'font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full',
    nodeIdentity: 'flex items-center gap-2.5 my-2.5',
    nodeIconWrap:
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-2xs',
    nodeTitle: 'text-xs font-extrabold text-content leading-tight break-words',
    nodeSubtitle: 'text-[10px] text-content-muted leading-tight break-words mt-0.5',
    nodeMetricStrip: 'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] border mb-2',
    nodeQueueBuffer: 'flex flex-col gap-1.5 rounded-xl border border-line/70 bg-surface-subtle/70 p-2 text-xs',
    nodeQueueHeader:
      'flex items-center justify-between text-[10px] font-bold text-content-subtle uppercase tracking-wider mb-1',
    nodeTicketItem:
      'flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] font-mono font-bold transition hover:scale-[1.02] cursor-pointer shadow-2xs bg-surface',
    nodeEmptyBuffer:
      'flex h-12 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-content-muted text-center',
    nodeAlertBanner:
      'flex items-center gap-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 px-2 py-1 text-[9px] font-bold text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs mt-2',

    // Animated connecting route tokens with real-time queue item dots
    routeWrap: 'relative z-0 flex flex-col items-center justify-center px-1 shrink-0 w-[140px]',
    routeTrack: 'w-full h-10 relative flex items-center justify-center',
    routeHighway: 'w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#2e2e2e] relative overflow-hidden',
    routeDotItemWrap: 'absolute top-1/2 -translate-y-1/2 phc-queue-dot-motion cursor-pointer z-10 group',
    routeItemDot:
      'flex items-center justify-center w-4 h-4 rounded-full border-2 text-[8px] font-mono font-bold shadow-xs transition-transform hover:scale-125 cursor-pointer',
    routeItemDotNormal: 'bg-rose-500 border-white dark:border-[#2e2e2e] text-white',
    routeItemDotStalled: 'bg-rose-600 border-rose-300 text-white ring-2 ring-rose-500/40 animate-pulse',
    routeTooltip:
      'absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 rounded bg-slate-900 text-white dark:bg-white dark:text-[#0d0d0d] px-1.5 py-0.5 text-[9px] font-mono whitespace-nowrap shadow-md pointer-events-none z-30',
    routeLabelCapsule:
      'flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-surface border border-line shadow-2xs whitespace-nowrap mt-1',
    routeDotActive: 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse',
    routeDotIdle: 'w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#404040]',
    routeItemBadge:
      'font-mono text-[8px] font-extrabold px-1.5 py-0.2 rounded-full border bg-surface text-content-muted',

    // Branching bays container
    branchingBaysSection:
      'relative mt-2 pt-5 pb-4 rounded-2xl border border-line/80 bg-surface-subtle/50 px-5 flex flex-col gap-4',
    branchingHeader: 'flex flex-wrap items-center justify-between gap-3',
    branchingTitleWrap: 'flex items-center gap-2.5',
    branchingIcon:
      'flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-base border border-rose-200 dark:border-rose-900',
    branchingTitle: 'text-xs font-extrabold text-content tracking-wide uppercase',
    branchingSubtitle: 'text-[11px] text-content-muted',
    branchingGrid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5',
    bayCard:
      'group flex flex-col justify-between rounded-xl border-2 p-3.5 shadow-2xs transition-all hover:scale-[1.02] hover:shadow-sm cursor-pointer relative bg-surface',
    bayHeader: 'flex items-center justify-between mb-2',
    bayTitle: 'font-extrabold text-content text-sm flex items-center gap-1.5',
    bayDoctor: 'text-[11px] text-content-muted break-words flex items-center gap-1',
    bayBody:
      'flex flex-col gap-1.5 rounded-lg bg-surface-subtle p-2.5 border border-line text-xs',
    bayTimerRow: 'flex items-center justify-between',
    bayTimerText: 'font-mono font-extrabold text-content',
    bayProgressWrap: 'w-full bg-slate-200 dark:bg-[#2e2e2e] h-1.5 rounded-full overflow-hidden mt-1',
    bayProgressBar: 'h-full rounded-full transition-all duration-300',

    // Branch stem connecting Stage 3 to bays
    branchStem: 'flex flex-col items-center justify-center my-1 relative z-0',
    branchStemLine: 'w-0.5 h-6 bg-rose-400 dark:bg-rose-600',
    branchStemBadge:
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-surface border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-2xs my-0.5',

    // Stage focus patient tray
    stageTray:
      'flex flex-col gap-3 rounded-2xl border border-line bg-surface-subtle/50 p-4 shadow-xs',
    stageTrayHeader: 'flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line',
    stageTrayTitle: 'text-xs font-bold text-content flex items-center gap-2',
    stageTrayGrid:
      'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto phc-scroll p-1',
    stageTrayCard:
      'flex items-center justify-between rounded-xl border p-3 text-xs transition-all hover:scale-[1.01] hover:shadow-xs cursor-pointer bg-surface',

    // Filter pills
    filterPillBase:
      'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
    filterPillActive:
      'bg-rose-600 dark:bg-rose-600 text-white font-bold shadow-xs border-rose-600 ring-2 ring-rose-500/30',
    filterPillInactive:
      'bg-surface text-content-muted hover:text-content hover:bg-surface-subtle border-line',
  },

  /** Minimal Orthogonal Process-Graph styling tokens. */
  processGraph: {
    canvasCard:
      'relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-xs overflow-hidden w-full',
    canvasHeader:
      'flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line mb-3',
    canvasTitleGroup: 'flex items-center gap-3',
    canvasIconWrap:
      'flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#242424] text-content text-lg border border-line shadow-2xs',
    canvasTitle: 'text-sm font-bold text-content',
    canvasSubtitle: 'text-xs text-content-muted mt-0.5',
    canvasControls: 'flex items-center gap-2',
    canvasScroll: 'w-full overflow-x-auto pb-4 pt-2 phc-scroll relative',
    canvasBoard:
      'relative min-w-[1260px] rounded-xl border border-line/60 bg-slate-50/50 dark:bg-[#0d0d0d]/60 p-4 select-none',
    svgOverlay: 'absolute inset-0 w-full h-full pointer-events-none z-0',

    // Rectangular Stage Nodes with Thin Borders
    nodeCard:
      'group flex flex-col justify-between rounded-xl border bg-surface p-3 text-xs shadow-2xs transition-all hover:scale-[1.02] hover:shadow-sm cursor-pointer relative z-10 select-none',
    nodeCardProcessing:
      'border-rose-500 ring-2 ring-rose-500/30 dark:ring-rose-500/20 shadow-sm',
    nodeCardIdle: 'border-line hover:border-slate-400 dark:hover:border-[#404040]',
    nodeHeader: 'flex items-center justify-between gap-1 mb-1.5',
    nodeTitle: 'text-xs font-bold text-content break-words flex items-center gap-1.5',
    nodeBadge:
      'inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full border',
    nodeBody: 'flex flex-col gap-1',
    nodeDoctor: 'text-[11px] text-content-muted break-words flex items-center gap-1',
    nodeCurrentPatient:
      'flex items-center justify-between rounded-lg bg-surface-subtle border border-line px-2 py-1 text-[11px] font-mono mt-1',
    nodeProcessingPill:
      'inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider',
    nodeEmpty:
      'flex items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-content-muted py-2 text-center',
    speedToggleBtn:
      'inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:text-content hover:bg-surface-subtle transition cursor-pointer select-none',
    activeSpeedBtn:
      'bg-slate-100 dark:bg-[#242424] text-[#a8071a] dark:text-[#f87171] border-[#a8071a]/40 dark:border-[#a8071a]/50 font-bold',
    dispatchBtn:
      'inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:text-content hover:bg-surface-subtle transition cursor-pointer shadow-2xs',
    groupFilterTabs:
      'inline-flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-line shadow-2xs',
    groupTabBtn:
      'px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer select-none',
    groupTabActive:
      'bg-surface text-rose-600 dark:text-rose-400 shadow-2xs font-bold border border-line',
    groupTabInactive:
      'text-content-muted hover:text-content border border-transparent',
    groupSectionHeader:
      'text-[10px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1',
    groupBadgeOpd:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    groupBadgeWarfarin:
      'bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#f5f5f5] border-slate-200 dark:border-[#2e2e2e]',
    groupBadgeSpecialized:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    groupBadgeEcg:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    groupBadgeRefill:
      'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900',
    groupBadgeBenzathine:
      'bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#f5f5f5] border-slate-200 dark:border-[#2e2e2e]',
    groupBadgeReschedule:
      'bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#f5f5f5] border-slate-200 dark:border-[#2e2e2e]',

    // Unified Stage 3 Container Block
    stage3Container:
      'flex flex-col rounded-xl border border-line bg-surface/95 dark:bg-[#1a1a1a]/95 p-3.5 shadow-xs transition-all relative z-10 select-none overflow-hidden',
    stage3ContainerProcessing:
      'border-rose-500/80 ring-2 ring-rose-500/20 shadow-sm',
    stage3Header:
      'flex items-center justify-between pb-2 mb-2 border-b border-line/80 gap-2',
    stage3Title:
      'text-xs font-extrabold text-content flex items-center gap-1.5',
    stage3Subtitle:
      'text-[10px] text-content-muted leading-tight',
    stage3Badge:
      'inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-line bg-surface-subtle text-content',
    stage3PodContainer:
      'flex flex-col gap-2.5 overflow-y-auto phc-scroll max-h-[350px] pr-0.5',
    stage3PodSection:
      'flex flex-col gap-1.5 p-2 rounded-lg border border-line/60 bg-surface-subtle/40',
    stage3PodTitleRow:
      'flex items-center justify-between',
    stage3PodTitle:
      'text-[10px] font-extrabold uppercase tracking-wider text-content-muted flex items-center gap-1',
    stage3PodGrid:
      'grid grid-cols-1 sm:grid-cols-2 gap-2',
    cubicleSubCard:
      'flex flex-col justify-between p-2 rounded-lg border border-line/80 bg-surface text-xs shadow-2xs transition-all hover:scale-[1.01] hover:border-slate-400 dark:hover:border-[#404040] cursor-pointer min-h-[66px]',
    cubicleSubCardOccupied:
      'border-rose-400/80 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-500/20',

    // Dedicated Per-Service Rectangle Block Styles (All 8 Clinical Services)
    serviceBlock:
      'flex flex-col justify-between rounded-xl border border-line bg-surface/95 dark:bg-[#1a1a1a]/95 p-3 shadow-2xs transition-all relative z-10 select-none overflow-hidden hover:border-slate-400 dark:hover:border-[#404040]',
    serviceBlockCollapsed:
      'flex flex-col justify-center rounded-xl border border-line bg-surface/95 dark:bg-[#1a1a1a]/95 px-3 py-2 shadow-2xs transition-all relative z-10 select-none hover:border-slate-400 dark:hover:border-[#404040]',
    serviceBlockProcessing:
      'border-rose-500/80 ring-2 ring-rose-500/20 shadow-xs',
    serviceBlockHeader:
      'flex items-center justify-between pb-1.5 mb-1.5 border-b border-line/70 gap-2 shrink-0',
    serviceBlockTitle:
      'text-xs font-bold text-content flex items-center gap-1.5 break-words',
    serviceBlockSubtitle:
      'text-[10px] text-content-muted leading-tight break-words',
    serviceBlockBadge:
      'inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-line bg-surface-subtle text-content shrink-0',
    serviceBlockScrollGrid:
      'grid grid-cols-2 lg:grid-cols-3 gap-1.5 overflow-y-auto phc-scroll max-h-[110px] pr-1',
    serviceRoomFilterPill:
      'px-1.5 py-0.2 text-[9px] font-bold rounded border transition cursor-pointer select-none whitespace-nowrap',
    serviceRoomFilterActive:
      'bg-slate-800 text-white dark:bg-white dark:text-[#0d0d0d] border-transparent',
    serviceRoomFilterInactive:
      'bg-surface-subtle text-content-muted border-line hover:text-content',
    cubicleCompactCard:
      'flex flex-col justify-between p-1.5 rounded-lg border border-line/80 bg-surface text-xs shadow-2xs transition-all hover:scale-[1.02] hover:border-slate-400 dark:hover:border-[#404040] cursor-pointer min-h-[50px]',
    cubicleCompactCardOccupied:
      'border-rose-400/80 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-500/25',
    serviceBlockToggleBtn:
      'p-1 text-content-muted hover:text-content rounded hover:bg-surface-subtle transition shrink-0 cursor-pointer',
    searchContainer:
      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-surface text-xs shadow-2xs',
    searchInput:
      'bg-transparent text-xs text-content placeholder:text-content-muted focus:outline-none w-36 sm:w-56',
    cubicleDoctorName:
      'text-[9px] text-content-muted flex items-center gap-1 break-words leading-tight',
    roomHeaderTag:
      'text-[9px] font-extrabold uppercase tracking-wider text-content-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-line/60',

    // Stage Detail Inspector Modal
    modalBackdrop:
      'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs transition-opacity',
    modalCard:
      'w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl transition-all',
    modalHeader: 'flex items-start justify-between border-b border-line pb-4',
    modalTitle: 'text-base font-bold text-content flex items-center gap-2',
    modalSubtitle: 'text-xs text-content-muted mt-0.5',
    modalCloseBtn:
      'rounded-lg p-1.5 text-content-muted hover:bg-surface-subtle hover:text-content transition cursor-pointer',
    modalBody: 'flex flex-col gap-4 pt-4 max-h-[70vh] overflow-y-auto phc-scroll',
    modalSectionTitle:
      'text-xs font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5',
    modalItemCard:
      'flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs shadow-2xs',
  },
} as const;

/** Color configurations and style tokens for each outpatient pipeline stage. */
export const PIPELINE_STAGE_STYLES: Record<
  PipelineStageKey,
  {
    border: string;
    bg: string;
    headerBorder: string;
    iconBg: string;
    iconText: string;
    badgeBg: string;
    badgeText: string;
    metricBg: string;
    metricBorder: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
  }
> = {
  waiting: {
    border: 'border-amber-200 dark:border-amber-900/80',
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    headerBorder: 'border-amber-200/80 dark:border-amber-900/60',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconText: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
    metricBg: 'bg-white/90 dark:bg-[#1a1a1a]/90',
    metricBorder: 'border-amber-200/80 dark:border-amber-900/60',
    pillBg: 'bg-white dark:bg-[#1a1a1a] hover:bg-amber-50 dark:hover:bg-amber-950/40',
    pillBorder: 'border-amber-200 dark:border-amber-900',
    pillText: 'text-amber-900 dark:text-amber-200',
  },
  dispatch: {
    border: 'border-purple-200 dark:border-purple-900/80',
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    headerBorder: 'border-purple-200/80 dark:border-purple-900/60',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    iconText: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60 border border-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-800 dark:text-purple-300',
    metricBg: 'bg-white/90 dark:bg-[#1a1a1a]/90',
    metricBorder: 'border-purple-200/80 dark:border-purple-900/60',
    pillBg: 'bg-white dark:bg-[#1a1a1a] hover:bg-purple-50 dark:hover:bg-purple-950/40',
    pillBorder: 'border-purple-200 dark:border-purple-900',
    pillText: 'text-purple-900 dark:text-purple-200',
  },
  examination: {
    border: 'border-rose-200 dark:border-rose-900/80',
    bg: 'bg-rose-50/40 dark:bg-rose-950/20',
    headerBorder: 'border-rose-200/80 dark:border-rose-900/60',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    iconText: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-800',
    badgeText: 'text-rose-800 dark:text-rose-300',
    metricBg: 'bg-white/90 dark:bg-[#1a1a1a]/90',
    metricBorder: 'border-rose-200/80 dark:border-rose-900/60',
    pillBg: 'bg-white dark:bg-[#1a1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/40',
    pillBorder: 'border-rose-200 dark:border-rose-900',
    pillText: 'text-rose-900 dark:text-rose-200',
  },
  carryout: {
    border: 'border-slate-200 dark:border-[#2e2e2e]',
    bg: 'bg-slate-50/60 dark:bg-[#242424]/40',
    headerBorder: 'border-slate-200/80 dark:border-[#2e2e2e]',
    iconBg: 'bg-slate-100 dark:bg-[#242424]',
    iconText: 'text-slate-700 dark:text-[#f5f5f5]',
    badgeBg: 'bg-slate-100 dark:bg-[#242424] border border-slate-300 dark:border-[#2e2e2e]',
    badgeText: 'text-slate-800 dark:text-[#f5f5f5]',
    metricBg: 'bg-white/90 dark:bg-[#1a1a1a]/90',
    metricBorder: 'border-slate-200/80 dark:border-[#2e2e2e]',
    pillBg: 'bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#242424]',
    pillBorder: 'border-slate-200 dark:border-[#2e2e2e]',
    pillText: 'text-slate-900 dark:text-[#f5f5f5]',
  },
  completed: {
    border: 'border-emerald-200 dark:border-emerald-900/80',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    headerBorder: 'border-emerald-200/80 dark:border-emerald-900/60',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconText: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    metricBg: 'bg-white/90 dark:bg-[#1a1a1a]/90',
    metricBorder: 'border-emerald-200/80 dark:border-emerald-900/60',
    pillBg: 'bg-white dark:bg-[#1a1a1a] hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    pillBorder: 'border-emerald-200 dark:border-emerald-900',
    pillText: 'text-emerald-900 dark:text-emerald-200',
  },
};


/** Status-specific color configurations for cubicle cards and badges. */
export const CUBICLE_STATUS_STYLES: Record<
  CubicleStatus,
  {
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    dot: string;
    icon: string;
  }
> = {
  available: {
    border: 'border-emerald-200 dark:border-emerald-900',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-900/50 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: 'bx-check-circle',
  },
  occupied: {
    border: 'border-rose-200 dark:border-rose-900',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeBg: 'bg-rose-100 border border-rose-300 dark:bg-rose-900/50 dark:border-rose-800',
    badgeText: 'text-rose-800 dark:text-rose-300',
    dot: 'bg-rose-500 animate-pulse',
    icon: 'bx-user',
  },
  maintenance: {
    border: 'border-amber-200 dark:border-amber-900',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-100 border border-amber-300 dark:bg-amber-900/50 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: 'bx-wrench',
  },
  cleaning: {
    border: 'border-teal-200 dark:border-teal-900',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeBg: 'bg-teal-100 border border-teal-300 dark:bg-teal-900/50 dark:border-teal-800',
    badgeText: 'text-teal-800 dark:text-teal-300',
    dot: 'bg-teal-500',
    icon: 'bx-brush',
  },
};

/** Visual color configuration for patient processing speed ratings. */
export const HEATMAP_SPEED_STYLES: Record<
  SpeedRating,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
  }
> = {
  fast: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-300 dark:border-emerald-800/80',
    badge:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
  optimal: {
    bg: 'bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50',
    text: 'text-teal-800 dark:text-teal-200',
    border: 'border-teal-300 dark:border-teal-800/80',
    badge:
      'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border border-teal-300 dark:border-teal-700',
    dot: 'bg-teal-500',
  },
  moderate: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-800/80',
    badge:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500',
  },
  slow: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50',
    text: 'text-rose-800 dark:text-rose-200',
    border: 'border-rose-300 dark:border-rose-800/80',
    badge:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700',
    dot: 'bg-rose-500',
  },
  inactive: {
    bg: 'bg-slate-50/80 dark:bg-[#1a1a1a]/40 hover:bg-slate-100 dark:hover:bg-[#242424]/50',
    text: 'text-slate-500 dark:text-[#a3a3a3]',
    border: 'border-slate-200 dark:border-[#2e2e2e]',
    badge:
      'bg-slate-100 text-slate-600 dark:bg-[#242424] dark:text-[#a3a3a3] border border-slate-200 dark:border-[#2e2e2e]',
    dot: 'bg-slate-400',
  },
};

/** Visual color configuration for cubicle idle downtime ratings. */
export const HEATMAP_IDLE_STYLES: Record<
  IdleRating,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
  }
> = {
  continuous: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-300 dark:border-emerald-800/80',
    badge:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  },
  'low-idle': {
    bg: 'bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50',
    text: 'text-teal-800 dark:text-teal-200',
    border: 'border-teal-300 dark:border-teal-800/80',
    badge:
      'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border border-teal-300 dark:border-teal-700',
    dot: 'bg-teal-500',
  },
  'moderate-idle': {
    bg: 'bg-slate-100 dark:bg-[#242424] hover:bg-slate-200/80 dark:hover:bg-[#2e2e2e]',
    text: 'text-slate-800 dark:text-[#f5f5f5]',
    border: 'border-slate-300 dark:border-[#2e2e2e]',
    badge:
      'bg-slate-200 text-slate-800 dark:bg-[#2e2e2e] dark:text-[#f5f5f5] border border-slate-300 dark:border-[#2e2e2e]',
    dot: 'bg-slate-500',
  },
  'high-idle': {
    bg: 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-800/80',
    badge:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500',
  },
  dormant: {
    bg: 'bg-slate-50/80 dark:bg-[#1a1a1a]/40 hover:bg-slate-100 dark:hover:bg-[#242424]/50',
    text: 'text-slate-500 dark:text-[#a3a3a3]',
    border: 'border-slate-200 dark:border-[#2e2e2e]',
    badge:
      'bg-slate-100 text-slate-600 dark:bg-[#242424] dark:text-[#a3a3a3] border border-slate-200 dark:border-[#2e2e2e]',
    dot: 'bg-slate-400',
  },
};

