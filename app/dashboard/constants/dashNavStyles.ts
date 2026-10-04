/**
 * @fileoverview Style dictionary for the enterprise Admin Dashboard navigation subsystem.
 *
 * Provides high-contrast solid surface tokens for the fixed desktop sidebar, mobile drawer,
 * sticky top header bar, dynamic breadcrumbs, live Manila clock, and user identity chip.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens and sizeTokens,
 * eliminates bluish slate and ad-hoc color styles, and avoids text truncation.
 *
 * @module app/dashboard/constants/dashNavStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

export const DASHBOARD_NAV_STYLES = {
  /** Desktop fixed sidebar rail styles */
  sidebar: {
    root: `hidden lg:flex flex-col w-64 shrink-0 ${themeTokens.surface.sidebar} min-h-screen sticky top-0 h-screen select-none`,
    brandHeader: `p-5 border-b ${themeTokens.border.default} flex items-center gap-3`,
    brandBadge: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-sm tracking-wide`,
    brandTitle: `text-xs font-bold ${themeTokens.text.primary} uppercase tracking-wider`,
    brandSubtitle: `text-[11px] font-semibold ${themeTokens.text.accent}`,
    navScrollArea: 'flex-1 overflow-y-auto p-4 space-y-6 phc-scroll',
    groupSection: 'space-y-1',
    groupTitle: `px-3 text-[10px] font-bold ${themeTokens.text.muted} uppercase tracking-widest mb-1.5`,
    navLink: `flex items-center gap-3 px-3 py-2 ${sizeTokens.radius.md} text-xs font-medium transition-all duration-150 group`,
    navLinkActive: `bg-[#a8071a]/10 text-[#a8071a] dark:bg-[#a8071a]/20 dark:text-[#f87171] font-semibold shadow-2xs border border-[#a8071a]/30`,
    navLinkIdle: `${themeTokens.text.secondary} hover:${themeTokens.text.primary} hover:bg-slate-100/80 dark:hover:bg-[#242424]`,
    navIcon: 'text-base shrink-0 transition-transform group-hover:scale-110',
    navIconActive: themeTokens.text.accent,
    footer: `p-4 border-t ${themeTokens.border.default} space-y-2 bg-slate-50/50 dark:bg-[#141414]/50`,
    statusBadge:
      'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold',
    statusDot: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse',
    footerText: `px-1 text-[10px] ${themeTokens.text.muted}`,
  },

  /** Responsive mobile slide-over drawer */
  drawer: {
    backdrop: `fixed inset-0 z-50 ${themeTokens.surface.backdrop} lg:hidden transition-opacity`,
    panel: `fixed inset-y-0 left-0 z-50 w-72 ${themeTokens.surface.drawerPanel} flex flex-col justify-between lg:hidden`,
    closeButton: `p-2 ${themeTokens.text.muted} hover:${themeTokens.text.primary} ${sizeTokens.radius.sm} hover:bg-slate-100 dark:hover:bg-[#242424]`,
  },

  /** Top sticky header bar */
  header: {
    root: `${themeTokens.surface.header} flex items-center justify-between px-4 sm:px-6 lg:px-8`,
    leftGroup: 'flex items-center gap-3 min-w-0',
    hamburgerButton: `lg:hidden p-2 ${sizeTokens.radius.sm} ${themeTokens.text.secondary} hover:bg-slate-100 dark:hover:bg-[#242424] transition`,
    breadcrumbs: `flex items-center gap-2 text-xs font-medium ${themeTokens.text.secondary} hidden sm:flex whitespace-nowrap`,
    breadcrumbActive: `${themeTokens.text.primary} font-semibold whitespace-nowrap`,
    breadcrumbSeparator: `${themeTokens.text.muted} shrink-0`,
    rightGroup: 'flex items-center gap-2.5 sm:gap-3 shrink-0',
    clockContainer: `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`,
    clockDate: `${sizeTokens.typography.micro} ${themeTokens.text.muted}`,
    clockTime: `text-xs font-mono font-bold ${themeTokens.text.primary}`,
    themeButton: `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer text-lg border border-transparent hover:${themeTokens.border.default}`,
    userChip: `flex items-center gap-2 px-2.5 py-1.5 ${sizeTokens.radius.md} bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default}`,
    userAvatar: `w-7 h-7 ${sizeTokens.radius.sm} bg-[#a8071a]/15 text-[#a8071a] dark:bg-[#a8071a]/30 dark:text-[#f87171] flex items-center justify-center font-bold text-xs`,
    userEmail: `text-xs font-semibold ${themeTokens.text.primary} hidden sm:inline whitespace-nowrap`,
    roleTag: `px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#a8071a] text-white`,
    signOutButton: `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-[#a8071a] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 dark:hover:text-[#f87171] transition cursor-pointer text-lg`,
  },
} as const;
