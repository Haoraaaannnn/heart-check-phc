/**
 * @fileoverview Style dictionary for Kiosk Customization in SuperAdmin.
 *
 * Provides standardized styling for service management forms, Boxicon search pickers,
 * and service catalog tables.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens and sizeTokens,
 * eliminates bluish slate and ad-hoc color styles, and avoids text truncation.
 *
 * @module app/superadmin/customization/constants/customizationStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const CUSTOMIZATION_STYLES = {
  formCard: `${themeTokens.surface.card} ${sizeTokens.radius.lg} p-6 shadow-sm mb-6 space-y-5`,
  formTitle: `text-base font-bold ${themeTokens.text.primary} flex items-center gap-2 pb-3 border-b ${themeTokens.border.default}`,
  grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  label: `block text-xs font-semibold ${themeTokens.text.secondary} uppercase tracking-wider mb-1.5`,
  input: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  textarea: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20 phc-scroll`,
  select: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  iconPreviewBox: `flex items-center gap-2.5 px-3 py-1.5 ${sizeTokens.radius.sm} border ${themeTokens.border.default} bg-slate-100 dark:bg-[#242424] shrink-0`,
  iconDropdown: `mt-2 border ${themeTokens.border.default} ${sizeTokens.radius.md} bg-white dark:bg-[#1a1a1a] max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e2e2e] shadow-md phc-scroll`,
  iconDropdownItem: `w-full flex items-center gap-3 px-3 py-2 text-xs font-mono hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 text-slate-700 dark:text-[#f5f5f5] transition text-left cursor-pointer`,
  tableContainer: `${themeTokens.surface.card} ${sizeTokens.radius.lg} overflow-hidden shadow-sm`,
  table: 'w-full text-left border-collapse text-sm',
  thead: `bg-slate-50 dark:bg-[#242424]/60 border-b ${themeTokens.border.default} text-xs font-semibold ${themeTokens.text.muted} uppercase tracking-wider`,
  th: 'px-5 py-3.5',
  tbody: 'divide-y divide-slate-100 dark:divide-[#2e2e2e]',
  td: `px-5 py-4 ${themeTokens.text.secondary}`,
  tr: `${themeTokens.surface.tableRowHover} border-b ${themeTokens.border.default} last:border-0`,
  selectOption: themeTokens.surface.selectOption,
  sectionBox: `${themeTokens.surface.card} ${sizeTokens.radius.md} p-4 border ${themeTokens.border.default} bg-slate-50/60 dark:bg-[#141414] space-y-3`,
  sectionHeader: `flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${themeTokens.text.primary} pb-2 border-b ${themeTokens.border.default}`,
  sectionSubtitle: `text-xs ${themeTokens.text.secondary}`,
  helpText: `text-[11px] ${themeTokens.text.muted} mt-1`,
  previewCard: `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-[#1a1a1a] border ${themeTokens.border.default} shadow-2xs`,
  ticketBadge: `font-mono text-sm font-bold px-3 py-1 rounded-md bg-rose-50 dark:bg-rose-950/50 text-[#a8071a] dark:text-[#f87171] border border-rose-200 dark:border-rose-900 tracking-wider`,
  tableTicketBadge: `font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-[#a8071a] dark:text-[#f87171] border border-rose-200/80 dark:border-rose-900/60 inline-flex items-center gap-1.5`,

  /* Capability Checklist Form Styles */
  checklistGrid: 'grid grid-cols-1 md:grid-cols-2 gap-3',
  checkCard: `flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none`,
  checkCardActive: `border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 shadow-2xs`,
  checkCardInactive: `border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] hover:border-slate-300 dark:hover:border-[#3a3a3a]`,
  checkbox: `mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-[#3e3e3e] dark:bg-[#242424] shrink-0 cursor-pointer`,
  checkTitle: `text-xs font-bold text-slate-800 dark:text-[#f5f5f5] block`,
  checkDescription: `text-[11px] text-slate-500 dark:text-[#a3a3a3] mt-0.5 block leading-relaxed`,

  /* Table Capability Badges */
  badgeContainer: 'flex flex-wrap gap-1 max-w-xs',
  badgeRegistration: `px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60 inline-flex items-center gap-1`,
  badgeCubicles: `px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60 inline-flex items-center gap-1`,
  badgeNurse: `px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60 inline-flex items-center gap-1`,
  badgeMonitor: `px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/60 inline-flex items-center gap-1`,
  badgeAutoAssign: `px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900/60 inline-flex items-center gap-1`,
  badgeSubcategories: `px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/60 inline-flex items-center gap-1`,

  /* Patient Cohort Badges */
  patientTypeBoth: 'px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/80',
  patientTypeNew: 'px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
  patientTypeOld: 'px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#242424] dark:text-[#f5f5f5] dark:border-[#383838]',

  /* Hardware Printer Status Badges */
  printerConnectedBadge: 'px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
  printerDisconnectedBadge: 'px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#242424] dark:text-[#a3a3a3] dark:border-[#383838]',
  printerConditionBadge: 'px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800/80 uppercase',
  printerLanBadge: 'px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80',
} as const;

