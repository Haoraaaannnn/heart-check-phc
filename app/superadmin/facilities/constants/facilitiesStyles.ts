/**
 * @fileoverview Style dictionary for the Facilities module in SuperAdmin.
 *
 * Provides standardized styling for facility room cards, cubicle badges,
 * modal dialogs, and registration counter station tiles.
 *
 * @module app/superadmin/facilities/constants/facilitiesStyles
 */

export const FACILITIES_STYLES = {
  container: 'space-y-6',
  statsGrid: 'grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6',
  statCard: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between',
  statIconBox: 'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0',
  sectionHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800',
  sectionTitle: 'text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2',
  roomCard: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition hover:shadow-sm',
  roomCardHeader: 'p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between',
  roomTitle: 'text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2',
  cubicleGrid: 'p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5',
  cubicleChip: 'p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200',
  input: 'w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500',
  select: 'w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500',
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4',
  modalPanel: 'w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4',
  counterRow: 'p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3 transition hover:shadow-sm',
  counterBadge: 'w-10 h-10 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm',
} as const;
