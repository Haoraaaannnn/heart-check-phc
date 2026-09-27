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

import type { CubicleStatus } from '@/app/dashboard/pages/cubicles/types/cubicle';

/** Auto-refresh interval for cubicle data queries (30 seconds). */
export const CUBICLES_REFRESH_INTERVAL_MS = 30000;

/** Clock tick update interval for elapsed times (60 seconds). */
export const CUBICLES_CLOCK_INTERVAL_MS = 60000;

/** Assumed average consultation time in minutes when calculating estimated end. */
export const AVG_CONSULTATION_MINUTES = 20;

/** Styling tokens specific to the Cubicles page. */
export const CUBICLES_STYLES = {
  /** Outer page wrapper matching the admin dashboard shell. */
  page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',

  /** Top banner / header region. */
  header: {
    root: 'flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6 shadow-card backdrop-blur-xl md:flex-row md:items-center md:justify-between',
    titleBlock: 'flex flex-col',
    title: 'text-2xl md:text-3xl font-extrabold text-content',
    subtitle: 'text-sm text-content-muted',
    timestamp: 'text-xs font-semibold text-content-subtle',
  },

  /** 4-column metric cards grid. */
  metricsGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',

  /** Metric card style tokens matching DashboardMetrics. */
  metricCard: {
    tile: 'flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5',
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
    tile: 'flex flex-col justify-between rounded-xl border-2 p-5 shadow-sm transition hover:shadow-md backdrop-blur-md',
    headerRow: 'flex items-center justify-between mb-3',
    number: 'text-lg font-extrabold text-content',
    statusBadge: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase',
    body: 'flex flex-col gap-1.5 text-xs',
    category: 'font-semibold text-content-muted capitalize',
    detailRow: 'flex items-center gap-1.5 text-content-muted',
    detailValue: 'font-bold text-content',
    timeText: 'font-mono text-content-muted',
    remainingPill:
      'inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },

  /** Status legend card. */
  legend: {
    container: 'flex flex-wrap items-center gap-6 pt-2',
    item: 'flex items-center gap-2 text-xs font-semibold text-content-muted',
    dot: 'h-3 w-3 rounded-full',
  },
} as const;

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
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: 'bx-check-circle',
  },
  occupied: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    badgeBg: 'bg-rose-500/15 border border-rose-500/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500 animate-pulse',
    icon: 'bx-user',
  },
  maintenance: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badgeBg: 'bg-amber-500/15 border border-amber-500/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: 'bx-wrench',
  },
  cleaning: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    badgeBg: 'bg-blue-500/15 border border-blue-500/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: 'bx-brush',
  },
};
