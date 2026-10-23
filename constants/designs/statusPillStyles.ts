/**
 * @fileoverview Central design system dictionary for status pills, badges, and tags.
 *
 * Provides high-contrast solid clinical surfaces, crisp 1-pixel borders, and
 * WCAG AAA compliant text tokens in both light and dark modes across the Heart Check PHC application.
 *
 * @remarks
 * Strictly conforms to AGENTS.md:
 * - Pure neutral dark mode surfaces (#0d0d0d, #141414, #1a1a1a, #242424, #2e2e2e).
 * - Crisp 1-pixel borders and high-contrast text hierarchies ensuring accessibility in dark mode.
 * - Prohibition of pillbox shape (rounded-md/rounded-lg instead of rounded-full).
 * - Centralized under constants/designs/ for universal global reuse.
 * - Strictly zero emojis in code, comments, and strings.
 *
 * @module constants/designs/statusPillStyles
 */

/** Presentation configuration for one ticket or process status group. */
export interface StatusStyle {
  /** Fixed label, or null to display the raw status text (capitalized). */
  label: string | null;
  /** Classes for the pill badge (background + text + crisp border, light and dark). */
  badge: string;
  /** Classes for the small colored status dot indicator. */
  dot: string;
  /** Classes for a colored count/number in that status's color. */
  text: string;
  /** Literal hex for charts/conic-gradients (Recharts and SVG components). */
  hex: string;
}

/** Supported queue ticket status groups. */
export type StatusGroupKey =
  | 'waiting'
  | 'serving'
  | 'idle'
  | 'done'
  | 'cancelled'
  | 'unknown';

/**
 * High-contrast presentation tokens for patient queue ticket status pills.
 *
 * In dark mode, uses solid rich background tints with 70% opacity, crisp 1-pixel borders,
 * and high-luminance text tokens to guarantee immediate readability across all dark surfaces.
 */
export const STATUS_STYLES: Record<StatusGroupKey, StatusStyle> = {
  waiting: {
    label: null,
    badge:
      'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/80',
    dot: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    hex: '#f97316',
  },
  serving: {
    label: 'Serving',
    badge:
      'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
    dot: 'bg-emerald-500 animate-pulse',
    text: 'text-emerald-700 dark:text-emerald-400',
    hex: '#10b981',
  },
  idle: {
    label: 'Idle',
    badge:
      'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-[#262626] dark:text-[#d4d4d4] dark:border-[#3a3a3a]',
    dot: 'bg-slate-400 dark:bg-[#737373]',
    text: 'text-slate-600 dark:text-[#a3a3a3]',
    hex: '#9ca3af',
  },
  done: {
    label: 'Done',
    badge:
      'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    hex: '#10b981',
  },
  cancelled: {
    label: 'Cancelled',
    badge:
      'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/80',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
    hex: '#ef4444',
  },
  unknown: {
    label: null,
    badge:
      'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-[#262626] dark:text-[#d4d4d4] dark:border-[#3a3a3a]',
    dot: 'bg-slate-400 dark:bg-[#737373]',
    text: 'text-slate-600 dark:text-[#a3a3a3]',
    hex: '#9ca3af',
  },
};

/**
 * Standard stage pill tokens for clinical pipeline columns (Nurse and Transfer).
 */
export const STAGE_PILL_STYLES = {
  assigned: {
    badge:
      'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  with_doctor: {
    badge:
      'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/80',
    dot: 'bg-purple-500 animate-pulse',
    text: 'text-purple-700 dark:text-purple-300',
  },
  carryout: {
    badge:
      'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/80',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
  },
  done: {
    badge:
      'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
} as const;

/**
 * Base styling primitives for pills and badges across all application views.
 */
export const PILL_BASE_STYLES = {
  container:
    'inline-flex w-max items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-bold whitespace-nowrap select-none',
  dot: 'h-2 w-2 rounded-full shrink-0',
  countBadge:
    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[11px] font-bold leading-none shrink-0 select-none',
} as const;
