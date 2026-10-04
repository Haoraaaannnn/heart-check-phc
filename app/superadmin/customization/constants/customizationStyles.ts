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
  formCard: `${themeTokens.surface.card} ${sizeTokens.radius.lg} p-6 shadow-sm mb-8 space-y-5`,
  formTitle: `text-base font-bold ${themeTokens.text.primary} flex items-center gap-2 pb-3 border-b ${themeTokens.border.default}`,
  grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  label: `block text-xs font-semibold ${themeTokens.text.secondary} uppercase tracking-wider mb-1.5`,
  input: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  textarea: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20 phc-scroll`,
  select: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  iconPreviewBox: `flex items-center gap-2.5 px-3 py-1.5 ${sizeTokens.radius.sm} border ${themeTokens.border.default} bg-slate-100 dark:bg-[#242424] shrink-0`,
  iconDropdown: `mt-2 border ${themeTokens.border.default} ${sizeTokens.radius.md} bg-white dark:bg-[#1a1a1a] max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2e2e2e] shadow-md phc-scroll`,
  iconDropdownItem: `w-full flex items-center gap-3 px-3 py-2 text-xs font-mono hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 text-slate-700 dark:text-[#f5f5f5] transition text-left cursor-pointer`,
  tableContainer: `${themeTokens.surface.card} ${sizeTokens.radius.md} overflow-hidden`,
  table: 'w-full text-left border-collapse text-sm',
  thead: `bg-slate-50 dark:bg-[#242424]/60 border-b ${themeTokens.border.default} text-xs font-semibold ${themeTokens.text.muted} uppercase tracking-wider`,
  th: 'px-5 py-3.5',
  td: `px-5 py-4 ${themeTokens.text.secondary}`,
  tr: `${themeTokens.surface.tableRowHover} border-b ${themeTokens.border.default} last:border-0`,
  selectOption: themeTokens.surface.selectOption,
} as const;
