/**
 * @fileoverview Style dictionary and design tokens for the Admin Dashboard skeleton loaders.
 *
 * Provides centralized Tailwind class combinations and semantic styling definitions
 * adhering to the solid enterprise standard of Heart Check PHC for skeletal loading states.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes semantic surface tokens (bg-surface, bg-surface-muted,
 * border-line, text-content), eliminates bluish slate and glowing gradients, and avoids text truncation.
 *
 * @module app/dashboard/constants/skeletonStyles
 */

import { cardSurface } from '@/constants/themes';
import { themeTokens, sizeTokens } from '@/constants/themeTokens';

/**
 * Styling tokens for all Admin Dashboard skeleton loading components.
 */
export const DASHBOARD_SKELETON_STYLES = {
  /** Root wrapper with pulse animation */
  root: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6 animate-pulse select-none',

  /** Welcome banner skeleton card */
  banner: {
    card: 'relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm',
    eyebrow: 'h-3.5 w-28 rounded-md bg-surface-muted',
    title: 'h-8 w-64 md:w-80 rounded-lg bg-surface-muted mt-2',
    subtitle: 'h-4 w-48 md:w-60 rounded-md bg-surface-muted mt-2',
  },

  /** Timeframe date filter bar skeleton */
  dateFilter: {
    root: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl border border-line bg-surface shadow-2xs',
    group: 'flex items-center gap-2 flex-wrap',
    label: 'h-4 w-20 rounded-md bg-surface-muted',
    pill: 'h-8 w-20 sm:w-24 rounded-xl bg-surface-muted border border-line',
    badge: 'h-7 w-28 rounded-lg bg-surface-muted border border-line',
  },

  /** Executive 4-tile KPI metric cards skeleton */
  metrics: {
    grid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
    card: 'flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm',
    icon: 'w-12 h-12 rounded-full bg-surface-muted border border-line shrink-0',
    content: 'flex flex-col gap-2 min-w-0 flex-1',
    label: 'h-3.5 w-24 rounded-md bg-surface-muted',
    value: 'h-7 w-20 rounded-md bg-surface-muted',
    subtitle: 'h-3 w-32 rounded-md bg-surface-muted',
  },

  /** Historical intelligence trigger banner skeleton */
  historical: {
    card: 'h-12 rounded-2xl border border-line bg-surface flex items-center justify-between px-5 shadow-2xs',
    text: 'h-4 w-56 rounded-md bg-surface-muted',
    badge: 'h-6 w-20 rounded-md bg-surface-muted',
  },

  /** Main 2-column layout grid */
  layout: {
    grid: 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]',
    column: 'flex min-w-0 flex-col gap-6',
    twoUp: 'grid grid-cols-1 gap-6 lg:grid-cols-2',
  },

  /** Generic dashboard card skeleton container */
  card: {
    root: `${cardSurface} rounded-2xl p-6`,
    header: 'mb-5 flex items-start justify-between gap-3',
    headerLeft: 'flex items-center gap-3',
    iconBadge: 'w-10 h-10 rounded-full bg-surface-muted border border-line shrink-0',
    headerTextGroup: 'space-y-1.5',
    title: 'h-4 w-36 rounded-md bg-surface-muted',
    subtitle: 'h-3 w-24 rounded-md bg-surface-muted',
    headerAction: 'h-8 w-28 rounded-lg bg-surface-muted border border-line',
    footerLink: 'mt-4 flex items-center justify-end',
    footerLinkBar: 'h-3 w-28 rounded-md bg-surface-muted',
  },

  /** Service queue and ticket breakdown donut charts skeleton */
  donutCard: {
    split: 'flex flex-col sm:flex-row items-center gap-6 pt-2',
    circleWrapper: 'flex shrink-0 items-center justify-center p-2',
    circle: 'w-32 h-32 md:w-36 md:h-36 rounded-full border-12 border-surface-muted flex items-center justify-center',
    circleInner: 'w-12 h-4 rounded-md bg-surface-muted',
    list: 'flex flex-1 flex-col gap-3 w-full',
    row: 'flex items-center gap-3',
    dot: 'w-2.5 h-2.5 rounded-full bg-surface-muted shrink-0',
    rowLabel: 'h-3.5 w-24 rounded-md bg-surface-muted',
    barTrack: 'flex-1 h-2 rounded-full bg-surface-muted overflow-hidden',
    count: 'h-3.5 w-7 rounded-md bg-surface-muted shrink-0',
  },

  /** Quick links shortcuts card skeleton */
  quickLinks: {
    grid: 'grid grid-cols-1 sm:grid-cols-3 gap-3',
    button: 'h-14 rounded-xl bg-surface-muted border border-line p-3 flex items-center gap-3',
    buttonIcon: 'w-8 h-8 rounded-lg bg-surface border border-line shrink-0',
    buttonText: 'h-3.5 w-20 rounded-md bg-surface',
  },

  /** Live queue table skeleton */
  tableCard: {
    tableWrap: 'overflow-x-auto',
    table: 'w-full border-collapse text-left',
    headRow: 'border-b border-line bg-surface-muted',
    th: 'px-3 py-2.5 text-[11px]',
    thBar: 'h-3 rounded-md bg-surface/80',
    row: 'border-b border-line last:border-0',
    td: 'px-3 py-3',
    cellBar: 'h-3.5 rounded-md bg-surface-muted',
    ticketBadge: 'h-5 w-16 rounded-md bg-surface-muted border border-line',
    statusBadge: 'h-5 w-20 rounded-full bg-surface-muted border border-line',
  },

  /** Hourly arrival bar chart skeleton */
  chartCard: {
    chartArea: 'h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-line',
    barWrapper: 'flex-1 flex flex-col items-center gap-1.5 h-full justify-end',
    bar: 'w-full rounded-t-md bg-surface-muted',
    axisLabel: 'h-2.5 w-6 rounded-md bg-surface-muted mt-2',
    xAxisRow: 'flex items-center justify-between gap-2 px-2 pt-2',
  },

  /** Recent activity timeline skeleton */
  activityCard: {
    list: 'flex flex-col gap-3.5',
    item: 'flex items-center gap-3',
    dot: 'w-2.5 h-2.5 rounded-full bg-surface-muted shrink-0',
    textGroup: 'flex-1 space-y-1',
    linePrimary: 'h-3.5 w-44 rounded-md bg-surface-muted',
    lineSecondary: 'h-2.5 w-24 rounded-md bg-surface-muted',
    time: 'h-3 w-16 rounded-md bg-surface-muted shrink-0',
  },
} as const;
