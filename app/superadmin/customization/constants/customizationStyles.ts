/**
 * @fileoverview Style dictionary for Kiosk Customization in SuperAdmin.
 *
 * Provides standardized styling for service management forms, Boxicon search pickers,
 * and service catalog tables.
 *
 * @module app/superadmin/customization/constants/customizationStyles
 */

export const CUSTOMIZATION_STYLES = {
  formCard: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8 space-y-5',
  formTitle: 'text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800',
  grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  label: 'block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5',
  input: 'w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500',
  textarea: 'w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 phc-scroll',
  select: 'w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500',
  iconPreviewBox: 'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0',
  iconDropdown: 'mt-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 shadow-md phc-scroll',
  iconDropdownItem: 'w-full flex items-center gap-3 px-3 py-2 text-xs font-mono hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 transition text-left cursor-pointer',
  tableContainer: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden',
  table: 'w-full text-left border-collapse text-sm',
  thead: 'bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
  th: 'px-5 py-3.5',
  td: 'px-5 py-4 text-slate-700 dark:text-slate-300',
  tr: 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800 last:border-0',
} as const;
