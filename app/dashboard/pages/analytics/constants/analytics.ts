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
    root: 'flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card backdrop-blur-xl md:flex-row md:items-center md:justify-between',
    titleBlock: 'flex flex-col',
    title: 'text-2xl md:text-3xl font-extrabold text-content',
    subtitle: 'text-sm text-content-muted',
    actions: 'flex items-center gap-3 flex-wrap',
    refreshPill: 'flex items-center gap-1.5 text-xs text-content-muted',
    refreshDot: 'h-2 w-2 rounded-full bg-brand-accent animate-pulse',
  },

  /** Metric card grid (4 columns). */
  metricsGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',

  /** Individual metric card tokens. */
  metricCard: {
    tile: 'flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5',
    iconWrap: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
    content: 'flex flex-col min-w-0 flex-1',
    label: 'text-xs font-semibold text-content-muted',
    value: 'text-3xl font-extrabold leading-tight text-content',
    unit: 'ml-1 text-lg font-bold text-content-muted',
    subtitle: 'mt-0.5 text-xs text-content-subtle',
  },

  /** Status card specifically for System Status (Overwhelmed / Elevated / Normal). */
  systemStatusCard: {
    base: 'flex flex-col justify-between rounded-2xl border p-5 shadow-card backdrop-blur-xl transition',
    Normal: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200',
    Elevated: 'border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200',
    Overwhelmed: 'border-rose-500/20 bg-rose-500/10 text-rose-900 dark:text-rose-200',
    eyebrow: 'text-xs font-bold uppercase tracking-widest text-content-muted',
    value: 'mt-2 text-3xl font-extrabold text-content',
    bottleneck: 'mt-1 text-xs font-semibold text-content-muted',
    reason: 'mt-1 text-xs leading-snug text-content-subtle',
  },

  /** Table styling tokens consistent with DASH.table. */
  table: {
    wrap: 'overflow-x-auto',
    table: 'w-full border-collapse text-left',
    headRow: 'border-b border-line bg-surface-muted/50',
    th: 'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-content-muted first:rounded-l-lg last:rounded-r-lg',
    row: 'border-b border-line transition last:border-0 hover:bg-surface-muted/60',
    td: 'px-4 py-3.5 text-sm text-content-muted',
  },

  /** Severity badge styles for Bottleneck stages. */
  levelBadge: {
    Normal: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    Elevated: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    Overwhelmed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    'No Data': 'bg-surface-muted text-content-muted border border-line',
    base: 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
  },

  /** Export button styling. */
  exportButton: {
    root: 'inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed',
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
  },

  /** Chart card layout. */
  chartGrid: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
} as const;

/** Queue stage line colors for wait-time trend charts. */
export const STAGE_LINES = [
  { dataKey: 'consultation', name: 'Consultation', color: '#cc3535' },
  { dataKey: 'ecg', name: 'ECG', color: '#3b82f6' },
  { dataKey: 'warfarin', name: 'Warfarin', color: '#10b981' },
  { dataKey: 'opdCard', name: 'OPD Card', color: '#f59e0b' },
  { dataKey: 'opdReschedule', name: 'OPD Reschedule', color: '#8b5cf6' },
  { dataKey: 'refillPrescription', name: 'Refill', color: '#ec4899' },
  { dataKey: 'opdScreening', name: 'Screening', color: '#06b6d4' },
  { dataKey: 'benzathine', name: 'Benzathine', color: '#84cc16' },
] as const;
