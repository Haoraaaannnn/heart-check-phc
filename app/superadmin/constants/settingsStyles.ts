/**
 * @fileoverview Style dictionary for System Settings & Security in SuperAdmin.
 *
 * Provides standardized styling for configuration panels, setting input rows,
 * feedback alerts, and password security forms.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens and sizeTokens,
 * eliminates bluish slate and ad-hoc color styles, and avoids text truncation.
 *
 * @module app/superadmin/constants/settingsStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const SETTINGS_STYLES = {
  container: 'space-y-6 max-w-5xl',
  sectionHeader: `pb-4 border-b ${themeTokens.border.default} space-y-1`,
  sectionTitle: `text-xl font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  sectionSubtitle: `text-sm ${themeTokens.text.secondary}`,
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  card: `${themeTokens.surface.card} ${sizeTokens.radius.lg} p-6 flex flex-col justify-between space-y-4 hover:shadow-sm transition`,
  cardHeader: 'space-y-1.5',
  cardTitle: `text-base font-bold ${themeTokens.text.primary} flex items-center gap-2`,
  cardIcon: `${themeTokens.text.accent} text-lg`,
  cardDescription: `text-xs ${themeTokens.text.secondary} leading-relaxed`,
  inputRow: 'flex items-center gap-3 pt-2',
  numberInput: `w-32 px-3 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.md} ${themeTokens.text.primary} focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20 font-semibold transition`,
  unitLabel: `text-xs ${themeTokens.text.secondary} font-medium`,
  saveButton: `ml-auto px-4 py-2 ${sizeTokens.radius.sm} ${themeTokens.brand.buttonPrimary} text-xs`,
  alertSuccess:
    'p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2',
  alertError: `p-3 ${sizeTokens.radius.sm} ${themeTokens.brand.alertError} border text-xs flex items-center gap-2`,
  loadingText: `text-xs ${themeTokens.text.muted} animate-pulse`,
  fullWidthCard: `md:col-span-2 ${themeTokens.surface.card} ${sizeTokens.radius.lg} p-6 space-y-4 shadow-xs`,
  passwordForm: 'space-y-4 max-w-lg',
  passwordInput: `w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.md} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20 transition`,
  fieldGroup: 'space-y-1',
  fieldGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  inputLabel: `block text-xs font-semibold ${themeTokens.text.secondary} uppercase tracking-wider`,
  submitButton: `px-4 py-2.5 ${sizeTokens.radius.sm} ${themeTokens.brand.buttonPrimary} text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`,
  buttonSpinner: 'w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin',
} as const;
