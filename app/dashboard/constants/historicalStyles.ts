/**
 * @fileoverview Style dictionary for the Historical Data Breakdown component.
 *
 * Implements the Enterprise Solid Surfaces standard:
 * - High-contrast solid foundations (`bg-surface`, `bg-surface-muted`)
 * - Crisp 1-pixel borders (`border-line`)
 * - Subtle elevation shadows (`shadow-2xs`, `shadow-xs`)
 * - Dual-theme compliant status tints without translucent glassmorphism
 *
 * @remarks
 * Conforms strictly to AGENTS.md: pure style dictionary, zero hardcoded components.
 *
 * @module app/dashboard/constants/historicalStyles
 */

export const HISTORICAL_STYLES = {
  /** Outer banner container */
  container:
    'relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-xs flex flex-col gap-6 transition-all duration-200',

  /** Top header with title and system status */
  header: {
    root: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-line',
    titleBlock: 'flex items-start gap-3.5 min-w-0',
    iconBadge:
      'w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shrink-0 shadow-2xs',
    textGroup: 'flex flex-col min-w-0',
    title: 'text-lg sm:text-xl font-extrabold text-content leading-tight',
    subtitle: 'text-xs sm:text-sm text-content-muted mt-1 leading-relaxed max-w-2xl',
    actions: 'flex items-center gap-2.5 flex-wrap shrink-0',
    collapseBtn:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface-muted text-xs font-semibold text-content-muted hover:text-content hover:bg-surface transition cursor-pointer select-none',
  },

  /** High-contrast clinical status badges */
  statusBadge: {
    base: 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider select-none shrink-0 shadow-2xs',
    dot: 'w-2 h-2 rounded-full',
    Normal:
      'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    NormalDot: 'bg-emerald-500 animate-pulse',
    Elevated:
      'border border-amber-300 dark:border-amber-800 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    ElevatedDot: 'bg-amber-500 animate-pulse',
    Overwhelmed:
      'border border-rose-300 dark:border-rose-800 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    OverwhelmedDot: 'bg-rose-500 animate-pulse',
    'No Data': 'border border-line bg-surface-muted text-content-muted',
    'No DataDot': 'bg-slate-400',
  },

  /** Three-column KPI summary cards */
  cardsGrid: 'grid grid-cols-1 sm:grid-cols-3 gap-4',

  card: {
    tile: 'flex items-start gap-4 rounded-xl border border-line bg-surface-muted p-4 shadow-2xs transition hover:-translate-y-0.5',
    iconWrap: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-2xs',
    content: 'flex flex-col min-w-0 flex-1',
    label: 'text-[11px] font-bold uppercase tracking-wider text-content-muted',
    value: 'text-2xl font-extrabold leading-tight text-content mt-1 break-words',
    subtitle: 'mt-1 text-xs text-content-subtle leading-snug',
    algoTag:
      'mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-content-muted bg-surface px-2 py-0.5 rounded-md border border-line w-max',
  },

  cardTones: {
    amber: {
      tile: 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20',
      icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    },
    purple: {
      tile: 'border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20',
      icon: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    },
    emerald: {
      tile: 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20',
      icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    },
  },

  /** Monthly breakdown sub-section */
  monthlySection: {
    root: 'flex flex-col gap-4 pt-4 border-t border-line',
    header: 'flex flex-col md:flex-row md:items-center md:justify-between gap-3',
    titleBlock: 'flex flex-col',
    title: 'text-base font-extrabold text-content',
    subtitle: 'text-xs text-content-muted mt-0.5',
    controls: 'flex items-center gap-2.5 flex-wrap',
    pillGroup:
      'flex items-center gap-1.5 p-1 rounded-xl bg-surface-muted border border-line select-none',
    yearPill:
      'px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none outline-none',
    yearPillActive: 'bg-rose-600 text-white font-bold shadow-2xs border border-rose-600',
    yearPillIdle:
      'text-content-muted hover:text-content hover:bg-surface border border-transparent',
    selectFallback:
      'text-xs font-semibold bg-surface-muted border border-line rounded-lg px-2.5 py-1.5 text-content outline-none',
  },

  /** Monthly table styles */
  table: {
    wrap: 'overflow-x-auto rounded-xl border border-line bg-surface shadow-2xs',
    table: 'w-full border-collapse text-left',
    headRow: 'border-b border-line bg-surface-muted select-none',
    th: 'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-content-muted whitespace-nowrap',
    row: 'border-b border-line transition last:border-0 hover:bg-surface-muted/60',
    td: 'px-4 py-3.5 text-sm text-content whitespace-nowrap',
    monthName: 'font-semibold text-content flex items-center gap-2',
    monthIcon: 'text-content-muted text-base',
    patientBadge:
      'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-muted border border-line text-content',
    stageBadge:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-muted border border-line text-content',
    journeyTime: 'font-semibold text-content flex items-center gap-1.5',
    journeyIcon: 'text-content-subtle text-sm',
    emptyMessage: 'py-10 text-center text-sm text-content-subtle',
    errorMessage: 'py-8 text-center text-xs font-medium text-rose-600 dark:text-rose-400',
    skeletonRow: 'animate-pulse border-b border-line',
    skeletonCell: 'h-4 bg-surface-muted rounded my-2',
  },

  /** On-demand expand/collapse trigger bar */
  triggerBar: {
    root: 'flex items-center justify-between gap-4 p-4 rounded-2xl border border-line bg-surface shadow-2xs transition hover:border-rose-300 dark:hover:border-rose-900 cursor-pointer select-none',
    left: 'flex items-center gap-3.5 min-w-0',
    iconBadge:
      'w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0 shadow-2xs',
    titleWrap: 'flex flex-col min-w-0',
    title: 'text-sm font-extrabold text-content truncate',
    subtitle: 'text-xs text-content-muted truncate hidden sm:inline mt-0.5',
    toggleBtn:
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs',
  },

  /** Bottom clinical notice strip */
  footer: {
    root: 'flex items-start gap-2.5 px-4 py-3 rounded-xl border border-line bg-surface-muted text-xs text-content-muted leading-relaxed',
    icon: 'text-base text-rose-600 dark:text-rose-400 shrink-0 mt-0.5',
  },
} as const;
