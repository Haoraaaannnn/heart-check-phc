/**
 * @fileoverview Style dictionary for System Settings & Security in SuperAdmin.
 *
 * Provides standardized styling for configuration panels, setting input rows,
 * feedback alerts, and password security forms.
 *
 * @module app/superadmin/constants/settingsStyles
 */

export const SETTINGS_STYLES = {
  container: 'space-y-6 max-w-4xl',
  sectionHeader: 'pb-4 border-b border-slate-200 dark:border-slate-800 space-y-1',
  sectionTitle: 'text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2',
  sectionSubtitle: 'text-sm text-slate-500 dark:text-slate-400',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  card: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-sm transition',
  cardHeader: 'space-y-1.5',
  cardTitle: 'text-base font-bold text-slate-900 dark:text-white flex items-center gap-2',
  cardIcon: 'text-rose-600 dark:text-rose-400 text-lg',
  cardDescription: 'text-xs text-slate-500 dark:text-slate-400 leading-relaxed',
  inputRow: 'flex items-center gap-3 pt-2',
  numberInput: 'w-32 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold',
  unitLabel: 'text-xs text-slate-500 dark:text-slate-400 font-medium',
  saveButton: 'ml-auto px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs',
  alertSuccess: 'p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2',
  alertError: 'p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2',
  loadingText: 'text-xs text-slate-400 animate-pulse',
  fullWidthCard: 'md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4',
  passwordForm: 'space-y-4 max-w-lg',
  passwordInput: 'w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500',
} as const;
