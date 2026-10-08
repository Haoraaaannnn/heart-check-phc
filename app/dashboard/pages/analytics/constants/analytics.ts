/**
 * @fileoverview Style tokens, chart configurations, and visual property dictionaries
 * for the Analytics dashboard page.
 *
 * Adheres strictly to the architectural standards defined in AGENTS.md, ensuring
 * all layout classes, theme tokens, color maps, and dimensional constants are
 * completely decoupled from JSX markup.
 *
 * @module app/dashboard/pages/analytics/constants/analytics
 */

import { cardSurface } from '@/constants/themes';
import { themeTokens } from '@/constants/themeTokens';
import { COMMON_ICONS } from '@/constants/icons';

/** Icon tokens for Analytics page controls and indicators. */
export const ANALYTICS_ICONS = {
  download: COMMON_ICONS.download,
  spinner: COMMON_ICONS.spinner,
  calendar: 'bx-calendar',
  calendarCheck: 'bx-calendar-check',
  calendarEvent: 'bx-calendar-event',
  layer: 'bx-layer',
  chevronLeft: 'bx-chevron-left',
  chevronRight: 'bx-chevron-right',
  close: 'bx-x',
  file: 'bx-file',
  infoCircle: 'bx-info-circle',
  check: 'bx-check',
  errorCircle: 'bx-error-circle',
} as const;

/** Presets for the date range selector. */
export const ANALYTICS_PRESETS = [
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Last 6 Months', value: '180d' },
  { label: 'Last Year', value: '365d' },
  { label: 'All Time', value: 'all' },
] as const;

/** Polling intervals corresponding to data ranges. */
export const POLL_INTERVAL_MS: Record<string, number> = {
  '90d': 60_000,
  '180d': 120_000,
  '365d': 180_000,
  all: 300_000,
};

/** Cache freshness threshold in milliseconds before background refetch. */
export const CACHE_STALE_MS = 30_000;

/** Styling tokens specific to the Analytics page. */
export const ANALYTICS_STYLES = {
  /** Outer page wrapper matching the admin dashboard shell. */
  page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',

  /** Top banner / header region. */
  header: {
    root: 'flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm md:flex-row md:items-center md:justify-between',
    titleBlock: 'flex flex-col',
    title: 'text-2xl md:text-3xl font-extrabold text-content',
    subtitle: 'text-sm text-content-muted',
    actions: 'flex items-center gap-3 flex-wrap',
    refreshPill: 'flex items-center gap-1.5 text-xs text-content-muted',
    refreshDot: 'h-2 w-2 rounded-full bg-brand-accent animate-pulse',
    importButton:
      'inline-flex items-center gap-2 rounded-xl bg-[#a8071a] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#8e0616] focus:outline-none focus:ring-2 focus:ring-[#a8071a]/50',
  },

  /** Metric card grid (4 columns). */
  metricsGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',

  /** Individual metric card tokens. */
  metricCard: {
    tile: 'flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5',
    iconWrap: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
    content: 'flex flex-col min-w-0 flex-1',
    label: 'text-xs font-semibold text-content-muted',
    value: 'text-3xl font-extrabold leading-tight text-content',
    unit: 'ml-1 text-lg font-bold text-content-muted',
    subtitle: 'mt-0.5 text-xs text-content-subtle',
  },

  /** Status card specifically for System Status (Overwhelmed / Elevated / Normal). */
  systemStatusCard: {
    base: 'flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition',
    Normal: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    Elevated: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    Overwhelmed: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
    eyebrow: 'text-xs font-bold uppercase tracking-widest text-content-muted',
    value: 'mt-2 text-3xl font-extrabold text-content',
    bottleneck: 'mt-1 text-xs font-semibold text-content-muted',
    reason: 'mt-1 text-xs leading-snug text-content-subtle',
  },

  /** Table styling tokens consistent with DASH.table. */
  table: {
    wrap: 'overflow-x-auto',
    table: 'w-full border-collapse text-left',
    headRow: 'border-b border-line bg-surface-muted',
    th: 'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-content-muted first:rounded-l-lg last:rounded-r-lg',
    row: 'border-b border-line transition last:border-0 hover:bg-surface-muted',
    td: 'px-4 py-3.5 text-sm text-content-muted',
  },

  /** Severity badge styles for Bottleneck stages. */
  levelBadge: {
    Normal: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    Elevated: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    Overwhelmed: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
    'No Data': 'bg-surface-muted text-content-muted border border-line',
    base: 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
  },

  /** Export button styling. */
  exportButton: {
    root: 'inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
    spinner: 'h-4 w-4 animate-spin',
  },

  /** Export modal styling definitions. */
  exportModal: {
    backdrop:
      'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 transition-opacity animate-in fade-in duration-200',
    modalBox:
      'relative z-[10000] w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl transition-all',
    header: 'flex items-start justify-between border-b border-line pb-4',
    titleWrap: 'flex flex-col gap-1',
    title: 'text-xl font-bold text-content flex items-center gap-2',
    titleIcon: 'text-emerald-600 dark:text-emerald-400 text-2xl',
    subtitle: 'text-xs text-content-muted leading-relaxed',
    closeBtn:
      'rounded-lg p-1.5 text-content-muted hover:bg-surface-muted hover:text-content transition cursor-pointer',
    closeIcon: 'text-xl',
    body: 'mt-5 flex flex-col gap-4',
    section: 'flex flex-col gap-2',
    sectionLabel:
      'text-xs font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5',
    modeSelector: 'grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-muted border border-line',
    modeBtn:
      'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition outline-none cursor-pointer',
    modeBtnActive:
      'bg-emerald-600 text-white shadow-sm font-bold',
    modeBtnIdle:
      'text-content-muted hover:text-content hover:bg-surface/60',
    dateInputRow: 'flex flex-col gap-2',
    dateInput:
      'w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-content outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:light] dark:[color-scheme:dark]',
    recordedDateSubLabel: 'text-[11px] font-semibold text-content-muted',
    dateSelect:
      'w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-content outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    dateBadgeRow: 'mt-0.5 flex items-center gap-1.5 text-xs font-medium',
    dateBadgeSuccess: 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1',
    dateBadgeMuted: 'text-amber-600 dark:text-amber-400 flex items-center gap-1',
    allDatesNoticeCard:
      'flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-3.5 text-xs text-content-muted leading-relaxed',
    allDatesNoticeIcon: 'text-emerald-600 dark:text-emerald-400 text-lg shrink-0 mt-0.5',
    yearRow: 'flex items-center gap-2',
    yearSelect:
      'w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-content outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    yearButton:
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-content hover:bg-surface-muted transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
    monthGrid: 'grid grid-cols-3 sm:grid-cols-4 gap-2',
    loadingDates:
      'flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted py-4 px-3 text-xs text-content-muted font-medium',
    emptyState:
      'flex items-center justify-center rounded-xl border border-line bg-surface-muted py-4 px-3 text-xs text-content-muted font-medium',
    monthBtn:
      'flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-semibold border transition outline-none cursor-pointer',
    monthBtnActive:
      'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold ring-2 ring-emerald-500/30',
    monthBtnIdle:
      'bg-surface-muted border-line text-content hover:bg-surface-muted hover:border-emerald-500/50',
    serviceSelect:
      'w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-content outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    selectOption: themeTokens.surface.selectOption,
    infoCard:
      'rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-3.5 text-xs text-content-muted flex flex-col gap-1.5',
    infoRow: 'flex items-center justify-between text-xs',
    infoLabel: 'text-content-muted',
    infoValue: 'font-semibold text-content',
    errorBanner:
      'flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-700 dark:text-rose-300',
    successBanner:
      'flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300',
    footer: 'mt-6 flex items-center justify-end gap-3 border-t border-line pt-4',
    cancelBtn:
      'rounded-xl border border-line bg-surface px-4 py-2 text-xs md:text-sm font-semibold text-content hover:bg-surface-muted transition cursor-pointer',
    confirmBtn:
      'flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer',
    spinner: 'h-4 w-4 animate-spin',
  },

  /** Range selector pills. */
  rangeSelector: {
    wrap: 'flex items-center gap-1.5 flex-wrap',
    pillBase:
      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition outline-none',
    pillActive: 'bg-brand-gradient border-transparent text-white shadow-sm',
    pillIdle:
      'bg-surface border-line text-content-muted hover:bg-surface-muted hover:text-content',
    spinner: 'h-3 w-3 animate-spin',
    divider: 'hidden sm:inline-block h-4 w-[1px] bg-line mx-1',
  },

  /** Chart card layout. */
  chartGrid: 'grid grid-cols-1 gap-6 lg:grid-cols-2',

  /** Reusable solid card pill and strip containers. */
  phcKpiCard: 'flex flex-col rounded-xl border border-line bg-surface-muted p-4',
  forecastPill: 'flex items-center justify-between rounded-xl border border-line bg-surface-muted p-4 flex-wrap gap-2',

  /** Daily drilldown panel styling tokens. */
  drilldown: {
    banner: 'flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm transition',
    header: 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-line pb-4',
    titleBlock: 'flex flex-col gap-1',
    title: 'text-lg md:text-xl font-extrabold text-content flex items-center gap-2.5',
    dateBadge: 'inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-[#242424] dark:text-[#f5f5f5] px-3 py-1 text-xs font-bold border border-slate-200 dark:border-[#2e2e2e]',
    subtitle: 'text-xs text-content-muted leading-relaxed',
    headerActions: 'flex items-center gap-2 flex-wrap',
    resetBtn: 'inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-content hover:bg-surface-muted active:scale-95 transition cursor-pointer shadow-xs',
    kpiGrid: 'grid grid-cols-2 gap-3 lg:grid-cols-4',
    kpiCard: 'flex flex-col rounded-xl border border-line bg-surface-muted p-4 transition',
    kpiLabel: 'text-[11px] font-bold uppercase tracking-wider text-content-muted',
    kpiValue: 'mt-1 text-2xl font-extrabold text-content',
    kpiSub: 'mt-0.5 text-xs text-content-subtle',
    systemStatusBadge: 'mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold w-fit',
    hintBanner: 'flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-[#2e2e2e] dark:bg-[#242424]/40 px-4 py-3 text-xs text-slate-800 dark:text-[#f5f5f5]',
    hintContent: 'flex items-center gap-2.5',
    hintIcon: 'text-lg text-slate-600 dark:text-[#a3a3a3] shrink-0',
    emptyNotice: 'flex flex-col items-center justify-center p-8 text-center text-xs text-content-muted rounded-xl border border-line bg-surface-muted gap-2',
    loadingNotice: 'flex items-center justify-center gap-2.5 p-8 text-center text-xs text-content-muted rounded-xl border border-line bg-surface-muted font-medium',
    spinner: 'h-4 w-4 animate-spin text-brand-accent',
    errorBanner: 'flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 p-4 text-xs font-medium text-rose-700 dark:text-rose-300',
    retryBtn: 'rounded-lg border border-rose-300 bg-surface px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer dark:border-rose-800 dark:bg-rose-900 dark:text-rose-200',
  },

  /** Hourly stage mode switcher and badge tokens. */
  hourlyToggle: {
    container: 'flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e]',
    btnBase: 'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer',
    btnActive: 'bg-white text-slate-900 shadow-xs dark:bg-[#1f1f1f] dark:text-[#f5f5f5]',
    btnIdle: 'text-content-muted hover:text-content',
    noticePill: 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border',
    historicalPill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    livePill: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
  },
} as const;

/** Chart color tokens for interactive drill-downs. */
export const DRILLDOWN_CHART_COLORS = {
  barNormal: '#3b82f6',
  barActive: '#1d4ed8',
  barHover: '#2563eb',
  movingAvg: '#f59e0b',
  hourlyDayIntake: '#2563eb',
  hourlyRangeAvg: '#cc3535',
  referenceLine: '#2563eb',
} as const;

/** Queue stage line colors for wait-time trend charts. */
export const STAGE_LINES = [
  { dataKey: 'avg_wait_registration', name: 'Kiosk Wait', color: '#06b6d4' },
  { dataKey: 'avg_service_registration', name: 'Registration Duration', color: '#f59e0b' },
  { dataKey: 'avg_wait_consultation', name: 'Wait for Doctor', color: '#8b5cf6' },
  { dataKey: 'avg_service_consultation', name: 'With Doctor (Consultation)', color: '#10b981' },
  { dataKey: 'avg_service_carryout', name: 'Carryout Duration', color: '#ec4899' },
  { dataKey: 'avg_total_time', name: 'Total Journey', color: '#3b82f6' },
] as const;

/** Palette tokens for per-stage hourly distribution curves. */
export const HOURLY_STAGE_COLORS = {
  kiosk: '#06b6d4',          // Cyan - Kiosk Check-in / Ticket issuance
  registration: '#f59e0b',   // Amber - Registration Counter
  waitDoctor: '#8b5cf6',     // Purple - Wait for Doctor / Triage
  withDoctor: '#10b981',     // Emerald - With Doctor Consultation
  carryout: '#ec4899',       // Pink - Carryout Process
  intake: '#2563eb',         // Primary Blue - Selected Day Intake
  benchmark: '#cc3535',      // Crimson - Overall Range Average Benchmark
} as const;
