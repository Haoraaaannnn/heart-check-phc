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
  statCard: `${themeTokens.surface.card} ${sizeTokens.radius.lg} p-5 flex items-center gap-4 transition hover:-translate-y-0.5 shadow-sm`,
  statIconBox: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
  sectionHeader: `flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${themeTokens.border.default}`,
  sectionTitle: `text-lg font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  roomCard: `${themeTokens.surface.card} ${sizeTokens.radius.lg} overflow-hidden transition hover:shadow-sm shadow-xs`,
  roomCardHeader: `p-4 bg-slate-50/80 dark:bg-[#242424]/50 border-b ${themeTokens.border.default} flex items-center justify-between`,
  roomTitle: `text-sm font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  cubicleGrid: 'p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5',
  cubicleChip: `p-2.5 ${sizeTokens.radius.md} border ${themeTokens.border.default} bg-slate-50 dark:bg-[#1f1f1f] hover:border-[#a8071a]/50 dark:hover:border-[#a8071a]/60 transition flex items-center justify-between text-xs font-semibold ${themeTokens.text.primary}`,
  input: `w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  select: `w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
  modalBackdrop: `fixed inset-0 z-50 flex items-center justify-center ${themeTokens.surface.backdrop} p-4`,
  modalPanel: `w-full max-w-md ${themeTokens.surface.modal} ${sizeTokens.radius.lg} overflow-hidden p-6 space-y-4`,
  counterRow: `p-4 ${themeTokens.surface.card} ${sizeTokens.radius.lg} flex items-center gap-3 transition hover:shadow-sm shadow-xs`,
  counterBadge: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} ${themeTokens.brand.buttonPrimary} flex items-center justify-center shrink-0 text-sm`,
  emptyCard: `${themeTokens.surface.card} ${sizeTokens.radius.lg} p-12 text-center`,
  sectionDivider: 'flex-1 h-px bg-slate-200 dark:bg-[#2e2e2e]',
  selectOption: themeTokens.surface.selectOption,
} as const;
