/**
 * @fileoverview Style dictionary and design tokens for the SuperAdmin skeleton loaders.
 *
 * Provides centralized Tailwind class combinations adhering to the enterprise solid
 * surfaces standard of Heart Check PHC for skeletal loading states.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens, sizeTokens,
 * and solid surfaces (bg-white dark:bg-[#1a1a1a], border-slate-200 dark:border-[#2e2e2e]).
 *
 * @module app/superadmin/constants/superadminSkeletonStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const SUPERADMIN_SKELETON_STYLES = {
  /** Page root wrapper */
  root: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6 animate-pulse select-none',

  /** Header banner card skeleton */
  banner: {
    root: 'rounded-2xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4',
    titleSection: 'space-y-2 min-w-0 flex-1',
    heading: 'h-8 w-64 md:w-80 rounded-lg bg-slate-100 dark:bg-[#242424]',
    subheading: 'h-4 w-48 md:w-96 rounded-md bg-slate-100 dark:bg-[#242424]',
    button: 'h-10 w-32 rounded-lg bg-slate-100 dark:bg-[#242424] shrink-0',
  },

  /** Tab navigation bar skeleton */
  tabs: {
    container: `inline-flex items-center gap-1.5 p-1 bg-white dark:bg-[#1a1a1a] ${sizeTokens.radius.md} border border-slate-200 dark:border-[#2e2e2e] shadow-2xs w-fit`,
    tab: 'h-8 w-28 rounded-md bg-slate-100 dark:bg-[#242424]',
  },

  /** KPI metric cards grid skeleton */
  metrics: {
    grid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
    card: 'flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-5 shadow-sm',
    iconWrap: 'w-12 h-12 rounded-full bg-slate-100 dark:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e] shrink-0',
    content: 'flex flex-col gap-2 min-w-0 flex-1',
    label: 'h-3.5 w-24 rounded-md bg-slate-100 dark:bg-[#242424]',
    value: 'h-7 w-16 rounded-md bg-slate-100 dark:bg-[#242424]',
    subtitle: 'h-3 w-32 rounded-md bg-slate-100 dark:bg-[#242424]',
  },

  /** User table card skeleton */
  table: {
    container: `${themeTokens.surface.card} ${sizeTokens.radius.lg} overflow-hidden shadow-sm`,
    toolbar: 'p-4 sm:p-5 border-b border-slate-200 dark:border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3',
    searchWrapper: 'h-9 max-w-md w-full rounded-lg bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e]',
    filterGroup: 'flex items-center gap-1.5 flex-wrap',
    filterPill: 'h-7 w-16 sm:w-20 rounded-lg bg-slate-50 dark:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e]',
    tableWrapper: 'overflow-x-auto phc-scroll',
    table: 'w-full text-left border-collapse text-sm',
    thead: 'bg-slate-50 dark:bg-[#242424]/60 border-b border-slate-200 dark:border-[#2e2e2e]',
    th: 'px-6 py-3.5',
    thBar: 'h-3 rounded-md bg-slate-200 dark:bg-[#2e2e2e]',
    tbody: 'divide-y divide-slate-100 dark:divide-[#2e2e2e]',
    tr: 'border-b border-slate-100 dark:border-[#2e2e2e] last:border-0',
    td: 'px-6 py-4 whitespace-nowrap',
    avatar: 'w-7 h-7 rounded-full bg-slate-100 dark:bg-[#242424] shrink-0',
    textBar: 'h-3.5 rounded-md bg-slate-100 dark:bg-[#242424]',
    rolePill: 'h-5 w-20 rounded-full bg-slate-100 dark:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e]',
    actionButton: 'h-6 w-14 rounded-lg bg-slate-100 dark:bg-[#242424]',
    pagination: 'px-6 py-4 border-t border-slate-200 dark:border-[#2e2e2e] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#141414]/70',
    paginationText: 'h-3.5 w-32 rounded-md bg-slate-100 dark:bg-[#242424]',
    paginationButtons: 'flex items-center gap-1.5',
    pageButton: 'h-7 w-7 rounded-md bg-slate-100 dark:bg-[#242424]',
  },

  /** Settings configuration row skeleton */
  settings: {
    inputRow: 'flex items-center gap-2 pt-1',
    inputBox: 'w-24 h-9 rounded-lg bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e]',
    unitLabel: 'w-16 h-4 rounded-md bg-slate-100 dark:bg-[#242424]',
    saveButton: 'w-20 h-9 rounded-lg bg-slate-100 dark:bg-[#242424] ml-2',
  },
} as const;
