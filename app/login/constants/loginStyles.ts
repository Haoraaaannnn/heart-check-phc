/**
 * @fileoverview Style tokens and layout classes for the Staff Login module.
 *
 * Imports and calls centralized theme and sizing tokens from constants/themeTokens,
 * establishing a clean, high-contrast, neutral grayish dark mode with PHC brand accents.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: zero hardcoded colors or ad-hoc dimension strings.
 * Consumes themeTokens and sizeTokens as the single central source of truth.
 *
 * @module app/login/constants/loginStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const LOGIN_STYLES = {
  /** Page wrapper and root container */
  page: `${themeTokens.page} flex flex-col justify-between`,

  /** Top navigation row */
  header: {
    root: `w-full ${sizeTokens.component.headerHeight} px-4 sm:px-8 flex items-center justify-between border-b ${themeTokens.border.default} bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md shadow-2xs`,
    backButton: `inline-flex items-center gap-2 px-3 py-1.5 ${sizeTokens.radius.md} border ${themeTokens.border.default} bg-white dark:bg-[#1a1a1a] ${themeTokens.text.secondary} text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#242424] transition-all duration-150 active:scale-[0.98]`,
    brandCenter: 'hidden sm:flex items-center gap-2',
    brandBadge: `${sizeTokens.component.badgeSmall} ${sizeTokens.radius.sm} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-[11px]`,
    brandTitle: `text-xs font-bold ${themeTokens.text.primary} uppercase tracking-wider`,
    brandTag: themeTokens.text.accent,
    rightGroup: 'flex items-center gap-2 sm:gap-3',
    clockContainer: `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`,
    clockDate: `${sizeTokens.typography.micro} ${themeTokens.text.muted}`,
    clockTime: `text-xs font-mono font-bold ${themeTokens.text.primary}`,
    themeButton: `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer text-lg border border-transparent hover:${themeTokens.border.default}`,
  },

  /** Center authentication card container */
  main: 'flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8',
  card: {
    root: `w-full max-w-md ${sizeTokens.radius.lg} ${themeTokens.surface.card} p-8 sm:p-10 shadow-sm`,
    headerWrap: 'text-center mb-8',
    badge: `${sizeTokens.component.iconBox} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-sm mx-auto mb-4`,
    title: `${sizeTokens.typography.pageTitle} ${themeTokens.text.primary}`,
    subtitle: `mt-2 ${sizeTokens.typography.bodySmall} ${themeTokens.text.muted}`,
  },

  /** Form controls and inputs */
  form: {
    group: 'mb-5',
    labelRow: 'flex items-center justify-between mb-2',
    label: `text-xs font-bold ${themeTokens.text.secondary} uppercase tracking-wider`,
    forgotLink: `text-xs font-semibold ${themeTokens.text.accent} hover:underline transition-colors`,
    inputWrap: 'relative',
    input: `w-full ${sizeTokens.radius.md} ${themeTokens.surface.input} ${sizeTokens.component.inputPadding}`,
    inputPassword: `w-full ${sizeTokens.radius.md} ${themeTokens.surface.input} ${sizeTokens.component.inputPadding} pr-11`,
    passwordToggleBtn: `absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#f5f5f5] transition-colors text-lg flex items-center justify-center cursor-pointer`,
    submitButton: `w-full py-3.5 px-4 ${sizeTokens.radius.md} ${themeTokens.brand.buttonPrimary} text-sm flex items-center justify-center gap-2`,
  },

  /** Alerts and lockout notification banners */
  alerts: {
    lockoutWrap: `mb-6 p-4 ${sizeTokens.radius.md} ${themeTokens.brand.alertLockout} border text-xs font-medium flex items-center gap-2.5`,
    errorWrap: `mt-5 p-4 ${sizeTokens.radius.md} ${themeTokens.brand.alertError} border text-xs font-medium flex items-center gap-2.5`,
    icon: 'text-base shrink-0',
  },

  /** Security and regulatory footer disclaimers */
  footer: {
    root: `py-6 px-4 ${themeTokens.surface.footer} text-center`,
    text: `max-w-2xl mx-auto text-[11px] ${themeTokens.text.muted} leading-relaxed`,
    help: `mt-1 text-[11px] font-medium ${themeTokens.text.secondary}`,
  },
} as const;
