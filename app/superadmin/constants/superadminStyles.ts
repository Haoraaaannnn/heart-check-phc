/**
 * @fileoverview Style dictionary and design tokens for the SuperAdmin module.
 *
 * Provides centralized Tailwind class combinations and semantic styling definitions
 * adhering to the solid enterprise standard of Heart Check PHC.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: consumes centralized themeTokens and sizeTokens,
 * eliminates bluish slate and ad-hoc color styles, and avoids text truncation.
 *
 * @module app/superadmin/constants/superadminStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

/**
 * Standard enterprise metric card tones shared between Admin and SuperAdmin dashboards.
 */
export const SUPERADMIN_TONES = {
  rose: {
    tile: 'border-rose-200 bg-rose-50 dark:border-[#76000d]/50 dark:bg-[#76000d]/20',
    icon: 'bg-rose-100 text-rose-700 dark:bg-[#76000d]/60 dark:text-[#f87171]',
  },
  emerald: {
    tile: 'border-emerald-200 bg-emerald-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  slate: {
    tile: 'border-slate-200 bg-slate-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-slate-100 text-slate-700 dark:bg-[#242424] dark:text-[#f5f5f5]',
  },
  purple: {
    tile: 'border-purple-200 bg-purple-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  amber: {
    tile: 'border-amber-200 bg-amber-50 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
} as const;

export type SuperadminToneKey = keyof typeof SUPERADMIN_TONES;

export const SUPERADMIN_STYLES = {
  layout: {
    page: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',
    container: themeTokens.page,
    mainWrapper: 'mx-auto flex w-full max-w-[1680px] flex-col gap-6',
    headerRow: `flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${themeTokens.border.default}`,
    titleSection: 'space-y-1',
    heading: `${sizeTokens.typography.pageTitle} ${themeTokens.text.primary}`,
    subheading: `${sizeTokens.typography.bodySmall} ${themeTokens.text.secondary} max-w-2xl`,
  },
  banner: {
    root: 'rounded-2xl border border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4',
    titleSection: 'space-y-1 min-w-0',
    heading: 'text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-[#f5f5f5]',
    subheading: 'text-sm text-slate-500 dark:text-[#a3a3a3]',
  },
  metricGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  metricCard: {
    tile: 'flex items-center gap-4 rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5',
    iconWrap: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
    content: 'flex flex-col min-w-0 flex-1',
    label: 'text-xs font-semibold text-slate-500 dark:text-[#a3a3a3]',
    value: 'text-3xl font-extrabold leading-tight text-slate-900 dark:text-[#f5f5f5]',
    subtitle: 'mt-0.5 text-xs text-slate-400 dark:text-[#737373]',
  },
  navigation: {
    bar: `${themeTokens.surface.header} z-40 shadow-xs`,
    barInner: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4',
    brandGroup: 'flex items-center gap-3',
    brandBadge: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-lg shadow-sm shrink-0`,
    brandTitle: `text-sm font-bold ${themeTokens.text.primary} uppercase tracking-wider`,
    brandSubtitle: `text-xs ${themeTokens.text.accent} font-medium`,
    navLinksGroup: 'hidden md:flex items-center gap-1',
    navLink: `px-3.5 py-2 ${sizeTokens.radius.sm} text-sm font-medium transition-all duration-150 flex items-center gap-2`,
    navLinkActive: `bg-[#a8071a]/10 text-[#a8071a] dark:bg-[#a8071a]/20 dark:text-[#f87171] font-semibold shadow-xs`,
    navLinkIdle: `${themeTokens.text.secondary} hover:${themeTokens.text.primary} hover:bg-slate-100 dark:hover:bg-[#242424]`,
    userSection: 'flex items-center gap-3',
    userBadge: `hidden sm:flex items-center gap-2 pl-3 border-l ${themeTokens.border.default}`,
    userEmail: `text-xs ${themeTokens.text.secondary} font-medium`,
    userRolePill: `px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#a8071a]/15 text-[#a8071a] dark:bg-[#a8071a]/25 dark:text-[#f87171] border border-[#a8071a]/30`,
    signOutButton: `px-3 py-1.5 ${sizeTokens.radius.sm} text-xs font-semibold ${themeTokens.text.secondary} hover:bg-[#a8071a]/10 hover:text-[#a8071a] dark:hover:bg-[#a8071a]/20 dark:hover:text-[#f87171] border ${themeTokens.border.default} transition cursor-pointer flex items-center gap-1.5`,
    themeToggleButton: `p-2 ${sizeTokens.radius.sm} text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer flex items-center justify-center text-lg border border-transparent hover:${themeTokens.border.default}`,
    mobileMenu: `md:hidden border-t ${themeTokens.border.default} bg-white dark:bg-[#141414] px-4 py-3 space-y-1`,
    mobileDivider: `pt-2 border-t ${themeTokens.border.default} flex items-center justify-between px-3 py-2`,
  },
  tabs: {
    container: `inline-flex items-center gap-1.5 p-1 bg-white dark:bg-[#1a1a1a] ${sizeTokens.radius.md} border ${themeTokens.border.default} shadow-2xs w-fit`,
    tab: `px-4 py-2 ${sizeTokens.radius.sm} text-xs font-semibold transition cursor-pointer flex items-center gap-2 select-none`,
    tabActive: `bg-slate-100 dark:bg-[#242424] text-[#a8071a] dark:text-[#f87171] shadow-2xs font-bold border ${themeTokens.border.default}`,
    tabIdle: `${themeTokens.text.secondary} hover:${themeTokens.text.primary} hover:bg-slate-50 dark:hover:bg-[#242424]/40 border border-transparent`,
  },
  statsCard: {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    card: `${themeTokens.surface.card} ${sizeTokens.radius.lg} p-5 transition hover:shadow-sm`,
    header: 'flex items-center justify-between mb-3',
    iconWrapper: `${sizeTokens.component.badgeSquare} ${sizeTokens.radius.md} flex items-center justify-center text-xl shrink-0`,
    title: `text-xs font-semibold ${themeTokens.text.muted} uppercase tracking-wider`,
    value: `text-3xl font-extrabold ${themeTokens.text.primary}`,
    description: `text-xs ${themeTokens.text.muted} mt-1`,
  },
  buttons: {
    primary: `px-4 py-2.5 ${sizeTokens.radius.sm} ${themeTokens.brand.buttonPrimary} text-sm flex items-center gap-2`,
    secondary: `px-4 py-2.5 ${sizeTokens.radius.sm} bg-white dark:bg-[#1a1a1a] border ${themeTokens.border.default} ${themeTokens.text.primary} font-medium text-sm hover:bg-slate-100 dark:hover:bg-[#242424] transition cursor-pointer`,
    danger: `px-4 py-2 ${sizeTokens.radius.sm} bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition shadow-xs cursor-pointer disabled:opacity-50`,
    ghost: `p-1.5 ${sizeTokens.radius.sm} ${themeTokens.text.muted} hover:${themeTokens.text.primary} hover:bg-slate-100 dark:hover:bg-[#242424] transition cursor-pointer`,
  },
  table: {
    container: `${themeTokens.surface.card} ${sizeTokens.radius.lg} overflow-hidden shadow-sm`,
    toolbar: `p-4 sm:p-5 border-b ${themeTokens.border.default} flex flex-col sm:flex-row sm:items-center justify-between gap-3`,
    searchWrapper: 'relative flex-1 max-w-md',
    searchInput: `w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.md} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20 transition`,
    searchIcon: `absolute left-3 top-2.5 ${themeTokens.text.muted} text-base`,
    filterGroup: 'flex items-center gap-1.5 flex-wrap',
    filterPill: `${sizeTokens.radius.md} px-3 py-1.5 text-xs font-semibold border transition cursor-pointer select-none`,
    filterPillActive: `bg-[#a8071a] text-white font-bold border-[#a8071a] shadow-2xs`,
    filterPillIdle: `bg-slate-50 dark:bg-[#242424] border ${themeTokens.border.default} ${themeTokens.text.secondary} hover:bg-white dark:hover:bg-[#1a1a1a] hover:${themeTokens.text.primary}`,
    tableWrapper: 'overflow-x-auto phc-scroll',
    table: 'w-full text-left border-collapse text-sm',
    thead: `bg-slate-50 dark:bg-[#242424]/60 border-b ${themeTokens.border.default} text-[11px] font-bold ${themeTokens.text.muted} uppercase tracking-wider`,
    th: 'px-6 py-3.5',
    tbody: `divide-y divide-slate-100 dark:divide-[#2e2e2e]`,
    tr: themeTokens.surface.tableRowHover,
    td: `px-6 py-4 ${themeTokens.text.secondary} whitespace-nowrap`,
    pagination: `px-6 py-4 border-t ${themeTokens.border.default} flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#141414]/70`,
    pageButton: `px-3 py-1.5 text-xs font-medium border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.secondary} hover:bg-white dark:hover:bg-[#242424] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`,
    pageButtonActive: `px-3 py-1.5 text-xs font-bold ${themeTokens.brand.buttonPrimary} ${sizeTokens.radius.sm}`,
    pageJumpInput: `w-14 ${sizeTokens.radius.sm} border ${themeTokens.border.default} bg-white dark:bg-[#1f1f1f] px-2 py-1 text-center text-xs font-semibold ${themeTokens.text.primary} outline-hidden focus:border-[#a8071a]`,
    pageJumpButton: `px-2.5 py-1 text-xs font-semibold border ${themeTokens.border.default} ${sizeTokens.radius.sm} bg-white dark:bg-[#1a1a1a] ${themeTokens.text.secondary} hover:bg-slate-50 dark:hover:bg-[#242424] transition cursor-pointer disabled:opacity-40`,
  },
  roles: {
    superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    admin: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    doctor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    nurse: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    registration: 'bg-slate-100 text-slate-800 dark:bg-[#242424] dark:text-[#f5f5f5] border border-slate-200 dark:border-[#2e2e2e]',
    basePill: 'px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize inline-flex items-center gap-1',
  },
  modal: {
    backdrop: `fixed inset-0 z-50 flex items-center justify-center ${themeTokens.surface.backdrop} p-4 overflow-y-auto`,
    panel: `w-full max-w-3xl ${themeTokens.surface.modal} ${sizeTokens.radius.lg} overflow-hidden my-8`,
    header: `p-6 border-b ${themeTokens.border.default} flex items-start justify-between bg-slate-50/50 dark:bg-[#242424]/40`,
    body: 'p-6 space-y-6 max-h-[75vh] overflow-y-auto phc-scroll',
    footer: `p-4 sm:p-6 border-t ${themeTokens.border.default} flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-[#242424]/40`,
    formGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    formGroup: 'space-y-1.5',
    label: `block text-xs font-semibold ${themeTokens.text.secondary} uppercase tracking-wider`,
    input: `w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
    select: `w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1f1f1f] border ${themeTokens.border.default} ${sizeTokens.radius.sm} ${themeTokens.text.primary} focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20`,
    selectOption: themeTokens.surface.selectOption,
    confirmPanel: `w-full max-w-md ${themeTokens.surface.modal} ${sizeTokens.radius.lg} overflow-hidden p-6 space-y-4`,
    callout: `p-4 ${sizeTokens.radius.md} ${themeTokens.surface.well} space-y-1`,
    assignmentSection: `border-t ${themeTokens.border.default} pt-5 space-y-4`,
    sectionHeader: 'flex items-center justify-between',
    assignmentScrollBox: `max-h-64 overflow-y-auto ${sizeTokens.radius.md} ${themeTokens.surface.well} p-3 space-y-3 phc-scroll`,
  },
} as const;
