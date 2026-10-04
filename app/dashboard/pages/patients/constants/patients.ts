/**
 * @fileoverview Style tokens, chart configurations, and visual property dictionaries
 * for the Patients dashboard page.
 *
 * Adheres strictly to the architectural standards defined in AGENTS.md, ensuring
 * all layout classes, theme tokens, color maps, and dimensional constants are
 * completely decoupled from JSX markup.
 *
 * @module app/dashboard/pages/patients/constants/patients
 */

import { cardSurface } from '@/constants/themes';

/** Distinct color palette for charts matching PHC aesthetic. */
export const COLORS: readonly string[] = [
  '#cc3535',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

/** Number of patient records rendered per pagination slice in the table. */
export const PATIENTS_PER_PAGE = 50;

/** Default empty hourly pattern dataset across regular hospital operating hours. */
export const DEFAULT_HOURLY_DATA = [
  { hour: '08:00', patients: 0 },
  { hour: '09:00', patients: 0 },
  { hour: '10:00', patients: 0 },
  { hour: '11:00', patients: 0 },
  { hour: '12:00', patients: 0 },
  { hour: '13:00', patients: 0 },
  { hour: '14:00', patients: 0 },
  { hour: '15:00', patients: 0 },
] as const;

/** Wait time bottleneck threshold in minutes before a patient is highlighted. */
export const BOTTLENECK_MINS = 60;

/** Auto-refresh interval for patient lists in milliseconds. */
export const PATIENT_REFRESH_INTERVAL_MS = 30000;

/** Styling tokens specific to the Patients page. */
export const PATIENTS_STYLES = {
  /** Outer page wrapper matching the admin dashboard shell. */
  page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',

  /** Top banner / header region. */
  header: {
    root: 'flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6 shadow-card backdrop-blur-xl',
    titleRow: 'flex items-center justify-between flex-wrap gap-4',
    title: 'text-2xl md:text-3xl font-extrabold text-content',
    subtitle: 'text-sm text-content-muted',
    errorBadge: 'inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-500/20',
  },

  /** Service filter pill bar. */
  filterBar: {
    container: 'flex gap-2 overflow-x-auto pb-1 scrollbar-thin',
    chipBase:
      'shrink-0 px-4 py-2 rounded-full text-xs md:text-sm font-bold border transition whitespace-nowrap outline-none focus:ring-2 focus:ring-brand-accent/30',
    chipActive: 'bg-brand-gradient border-transparent text-white shadow-sm',
    chipIdle:
      'bg-surface border-line text-content-muted hover:bg-surface-muted hover:text-content',
  },

  /** Top metric card grid (5 columns on desktop). */
  metricsGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5',

  /** Individual metric card token matching DashboardMetrics. */
  metricCard: {
    tile: 'flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5',
    iconWrap: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
    content: 'flex flex-col min-w-0 flex-1',
    label: 'text-xs font-semibold text-content-muted',
    value: 'text-3xl font-extrabold leading-tight text-content',
    unit: 'ml-1 text-lg font-bold text-content-muted',
    subtitle: 'mt-0.5 text-xs text-content-subtle',
  },

  /** Two-column chart grid. */
  chartsGrid: 'grid grid-cols-1 gap-6 lg:grid-cols-2',

  /** Table styling tokens consistent with DASH.table. */
  table: {
    root: `${cardSurface} rounded-2xl p-6`,
    header: 'mb-4 flex items-center justify-between flex-wrap gap-3',
    title: 'text-base md:text-lg font-extrabold text-content',
    subtitle: 'text-xs text-content-muted',
    countBadge: 'text-xs font-semibold text-content-muted',
    countHighlight: 'font-bold text-content',
    wrap: 'overflow-x-auto',
    table: 'w-full border-collapse text-left',
    headRow: 'border-b border-line bg-surface-muted/50',
    th: 'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-content-muted first:rounded-l-lg last:rounded-r-lg',
    row: 'border-b border-line transition last:border-0 hover:bg-surface-muted/60',
    td: 'px-4 py-3.5 text-sm text-content-muted',
    ticketBadge:
      'inline-block rounded-lg bg-red-500/10 px-3 py-1 font-mono text-sm font-extrabold text-red-600 dark:text-red-400 border border-red-500/20',
    statusBadge: 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
    emptyWrap: 'py-12 text-center',
    emptyTitle: 'text-base font-bold text-content',
    emptySubtitle: 'mt-1 text-xs text-content-muted',
    paginationWrap: 'mt-5 flex items-center justify-between border-t border-line pt-4 flex-wrap gap-3',
    paginationButton:
      'rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-content transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40',
    paginationInfo: 'text-xs font-semibold text-content-muted',
  },

  /** Service Queue Panel layout. */
  serviceQueue: {
    statusStrip: 'flex items-center gap-3 flex-wrap',
    badgeActive:
      'inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400',
    badgeStandby:
      'inline-flex items-center gap-2 rounded-full bg-surface-muted border border-line px-3 py-1 text-xs font-extrabold uppercase text-content-muted',
    indicatorDotActive: 'h-2 w-2 rounded-full bg-emerald-500 animate-pulse',
    indicatorDotStandby: 'h-2 w-2 rounded-full bg-content-subtle',
    roomsText: 'text-sm font-semibold text-content-muted',
    roomsValue: 'font-bold text-content',
    mainGrid: 'grid grid-cols-1 gap-6 lg:grid-cols-3',
    queueCardCol: 'lg:col-span-2',
    chartCardCol: 'lg:col-span-1',
    patientItem:
      'flex items-center justify-between rounded-xl border border-line bg-surface-muted/40 p-4 transition hover:bg-surface-muted',
    patientItemNext:
      'flex items-center justify-between rounded-xl border-2 border-brand-accent/40 bg-brand-accent/5 p-4 transition',
    patientInfo: 'flex items-center gap-3 min-w-0',
    patientNumber:
      'inline-block rounded-lg bg-red-500/10 px-3 py-1 font-mono text-sm font-extrabold text-red-600 dark:text-red-400 border border-red-500/20',
    patientMeta: 'flex flex-col',
    patientName: 'text-sm font-semibold text-content truncate',
    patientWait: 'text-xs text-content-muted',
    overduePill:
      'inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400',
  },
} as const;

/** Status color tokens for patient list badges. */
export const PATIENT_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  waiting: {
    bg: 'bg-amber-500/15 border border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  'in queue': {
    bg: 'bg-amber-500/15 border border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  serving: {
    bg: 'bg-blue-500/15 border border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500 animate-pulse',
  },
  'in service': {
    bg: 'bg-blue-500/15 border border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500 animate-pulse',
  },
  completed: {
    bg: 'bg-emerald-500/15 border border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  done: {
    bg: 'bg-emerald-500/15 border border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  default: {
    bg: 'bg-surface-muted border border-line',
    text: 'text-content-muted',
    dot: 'bg-content-subtle',
  },
};
