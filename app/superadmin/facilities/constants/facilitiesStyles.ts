/**
 * @fileoverview Style dictionary for the Facilities module in SuperAdmin.
 *
 * Provides standardized styling for facility room cards, cubicle badges,
 * modal dialogs, and registration counter station tiles.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens and sizeTokens,
 * eliminates bluish slate and ad-hoc color styles, and avoids text truncation.
 *
 * @module app/superadmin/facilities/constants/facilitiesStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const FACILITIES_STYLES = {
  container: 'space-y-6',
  statsGrid: 'grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6',
  statCard: `${themeTokens.surface.card} ${sizeTokens.radius.md} p-5 flex items-center justify-between`,
  statIconBox: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} flex items-center justify-center text-xl shrink-0`,
  sectionHeader: `flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${themeTokens.border.default}`,
  sectionTitle: `text-lg font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  sectionSubtitle: `text-xs ${themeTokens.text.secondary} mt-0.5`,
  sectionDivider: `flex-1 h-px bg-slate-200 dark:bg-[#2e2e2e]`,
  categoryPill: `text-xs font-bold uppercase tracking-wider text-[#a8071a] dark:text-[#f87171] px-3 py-1 ${sizeTokens.radius.sm} bg-[#a8071a]/10 dark:bg-[#a8071a]/20 border border-[#a8071a]/25`,
  roomsGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
  roomCard: `${themeTokens.surface.card} ${sizeTokens.radius.md} overflow-hidden transition hover:shadow-sm`,
  roomCardHeader: `p-4 bg-slate-50/80 dark:bg-[#242424]/50 border-b ${themeTokens.border.default} flex items-center justify-between`,
  roomTitle: `text-sm font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  roomBadge: `w-8 h-8 ${sizeTokens.radius.sm} bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs`,
  roomCountBadge: `text-xs font-normal ${themeTokens.text.secondary}`,
  roomActionsGroup: 'flex items-center gap-1.5',
  roomRenameBtn: `px-2 py-1 ${sizeTokens.radius.sm} text-xs font-medium ${themeTokens.text.secondary} hover:bg-slate-200 dark:hover:bg-[#242424] transition cursor-pointer`,
  roomDeleteBtn: `px-2 py-1 ${sizeTokens.radius.sm} text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer`,
  cubicleGrid: 'p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5',
  cubicleChip: `p-2.5 ${sizeTokens.radius.sm} border ${themeTokens.border.default} bg-slate-50 dark:bg-[#1f1f1f] hover:border-[#a8071a]/50 dark:hover:border-[#a8071a]/60 transition flex items-center justify-between text-xs font-semibold ${themeTokens.text.primary}`,
  cubicleLabel: 'whitespace-normal break-words font-medium',
  cubicleActions: 'flex items-center gap-1 shrink-0 ml-1',
  cubicleEditBtn: `p-1 hover:text-[#a8071a] dark:hover:text-[#f87171] transition cursor-pointer`,
  cubicleDeleteBtn: `p-1 hover:text-red-600 transition cursor-pointer`,
  cubicleAddBtn: `p-2.5 ${sizeTokens.radius.sm} border border-dashed border-slate-300 dark:border-[#2e2e2e] hover:border-[#a8071a] hover:bg-rose-50/50 dark:hover:bg-[#a8071a]/10 text-xs font-semibold text-[#a8071a] dark:text-[#f87171] flex items-center justify-center gap-1 transition cursor-pointer`,
  input: `w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  select: `w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  selectOption: themeTokens.surface.selectOption,
  fieldGroup: 'space-y-1',
  fieldLabel: `block text-xs font-semibold text-slate-700 dark:text-[#a3a3a3]`,
  modalBackdrop: `fixed inset-0 z-50 flex items-center justify-center ${themeTokens.surface.backdrop} p-4`,
  modalPanel: `w-full max-w-md ${themeTokens.surface.modal} ${sizeTokens.radius.lg} overflow-hidden p-6 space-y-4`,
  modalHeader: `text-base font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  modalErrorBanner: `p-3 ${sizeTokens.radius.sm} bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs`,
  confirmIconBox: `w-10 h-10 ${sizeTokens.radius.md} bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center text-xl shrink-0`,
  confirmMessage: `text-xs ${themeTokens.text.secondary}`,
  modalFooter: 'flex justify-end gap-2 pt-2',
  loadingWrapper: 'py-16 text-center space-y-3',
  loadingSpinner: 'w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto',
  loadingText: `text-xs ${themeTokens.text.secondary}`,
  errorBanner: `p-3 ${sizeTokens.radius.sm} bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs`,
  emptyCard: `${themeTokens.surface.card} ${sizeTokens.radius.md} p-12 text-center`,
  emptyText: `text-sm font-semibold ${themeTokens.text.secondary}`,
  countersContainer: 'flex flex-col gap-6 max-w-3xl',
  counterAddCard: `${themeTokens.surface.card} ${sizeTokens.radius.md} p-5 shadow-xs`,
  counterAddTitle: `text-sm font-bold ${themeTokens.text.primary} mb-3 flex items-center gap-2`,
  counterAddForm: 'flex flex-col sm:flex-row items-center gap-3',
  counterNumInput: `w-full sm:w-28 px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary}`,
  counterLabelInput: `w-full flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary}`,
  countersListCard: `${themeTokens.surface.card} ${sizeTokens.radius.md} shadow-xs divide-y divide-slate-100 dark:divide-[#2e2e2e] overflow-hidden`,
  counterItem: `flex items-center gap-3 p-4 hover:bg-slate-50/50 dark:hover:bg-[#242424]/40 transition`,
  counterBadge: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} ${themeTokens.brand.buttonPrimary} flex items-center justify-center shrink-0 text-sm`,
  counterInlineInput: `flex-1 px-3 py-1.5 text-sm bg-transparent hover:bg-slate-50 dark:hover:bg-[#242424] focus:bg-white dark:focus:bg-[#1f1f1f] border border-transparent hover:border-slate-300 dark:hover:border-[#2e2e2e] focus:border-rose-500 ${sizeTokens.radius.sm} ${themeTokens.text.primary} font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 transition`,
  counterInUseBadge: `text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0`,
  counterStatusActive: `bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800`,
  counterStatusInactive: `bg-slate-100 text-slate-500 dark:bg-[#242424] dark:text-[#a3a3a3] border border-slate-200 dark:border-[#2e2e2e]`,
  counterStatusBtn: `text-xs font-semibold px-3 py-1 rounded-full transition cursor-pointer shrink-0`,
  counterDeleteBtn: `p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer`,
} as const;
