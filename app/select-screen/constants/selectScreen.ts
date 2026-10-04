/**
 * @fileoverview Style tokens and screen options configuration for the Screen Display Selector.
 *
 * Imports and calls centralized theme and sizing tokens from constants/themeTokens,
 * establishing a clean, high-contrast, neutral grayish dark mode with PHC brand accents.
 *
 * @remarks
 * Conforms strictly to AGENTS.md: zero hardcoded colors or ad-hoc dimension strings.
 * Consumes themeTokens and sizeTokens as the single central source of truth.
 *
 * @module app/select-screen/constants/selectScreen
 */

import { ScreenOption } from '../types/selectScreen';
import { SELECT_SCREEN_TEXTS } from './selectScreenTexts';
import { themeTokens, sizeTokens } from '@/constants/themeTokens';

/**
 * Universal list of all valid staff roles permitted to access terminal displays.
 */
export const ALL_STAFF_ROLES: string[] = [
  'superadmin',
  'admin',
  'nurse',
  'staff',
  'doctor',
  'registration',
];

/**
 * Roles authorized to access clinical nurse station workstations.
 */
export const CLINICAL_ROLES: string[] = ['nurse', 'staff', 'doctor', 'admin', 'superadmin'];

/**
 * Roles authorized to access front-desk registration and transfer workstations.
 */
export const REGISTRATION_ROLES: string[] = [
  'registration',
  'nurse',
  'staff',
  'admin',
  'superadmin',
];

/**
 * Roles authorized to access managerial queue analytics and reports dashboards.
 */
export const DASHBOARD_ROLES: string[] = ['admin', 'superadmin'];

/**
 * Roles authorized to access full system governance and account management.
 */
export const SUPERADMIN_ROLES: string[] = ['superadmin'];

const T = SELECT_SCREEN_TEXTS.options;

/**
 * Master catalog of available screen displays and workstations with their route
 * destinations, permissions, and execution rules.
 */
export const SCREEN_OPTIONS: ScreenOption[] = [
  // Public Terminal Displays
  {
    id: 'kiosk',
    title: T.kiosk.title,
    badge: T.kiosk.badge,
    description: T.kiosk.description,
    icon: 'bx-devices',
    route: '/kiosk/pages/kiosk-new-old-selection',
    category: 'display',
    allowedRoles: ALL_STAFF_ROLES,
    requiresSignOut: true,
    notice: T.kiosk.notice,
    actionLabel: T.kiosk.actionButton,
  },
  {
    id: 'monitor',
    title: T.monitor.title,
    badge: T.monitor.badge,
    description: T.monitor.description,
    icon: 'bx-tv',
    route: '/monitor',
    category: 'display',
    allowedRoles: ALL_STAFF_ROLES,
    requiresSignOut: false,
    notice: T.monitor.notice,
    actionLabel: T.monitor.actionButton,
  },
  // Staff Operational Workstations
  {
    id: 'transfer',
    title: T.transfer.title,
    badge: T.transfer.badge,
    description: T.transfer.description,
    icon: 'bx-transfer-alt',
    route: '/transfer',
    category: 'workstation',
    allowedRoles: REGISTRATION_ROLES,
    actionLabel: T.transfer.actionButton,
  },
  {
    id: 'nurse',
    title: T.nurse.title,
    badge: T.nurse.badge,
    description: T.nurse.description,
    icon: 'bx-plus-medical',
    route: '/nurse',
    category: 'workstation',
    allowedRoles: CLINICAL_ROLES,
    actionLabel: T.nurse.actionButton,
  },
  {
    id: 'dashboard',
    title: T.dashboard.title,
    badge: T.dashboard.badge,
    description: T.dashboard.description,
    icon: 'bx-bar-chart-alt-2',
    route: '/dashboard',
    category: 'workstation',
    allowedRoles: DASHBOARD_ROLES,
    actionLabel: T.dashboard.actionButton,
  },
  {
    id: 'superadmin',
    title: T.superadmin.title,
    badge: T.superadmin.badge,
    description: T.superadmin.description,
    icon: 'bx-shield-quarter',
    route: '/superadmin',
    category: 'workstation',
    allowedRoles: SUPERADMIN_ROLES,
    actionLabel: T.superadmin.actionButton,
  },
];

/**
 * Tailwind styling class definitions for the Screen Display Selector interface.
 * Consumes centralized themeTokens and sizeTokens.
 */
export const SELECT_SCREEN_STYLES = {
  page: themeTokens.page,

  container: 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8',

  header: {
    root: `${themeTokens.surface.header} flex items-center justify-between px-4 sm:px-6 lg:px-8`,
    brandGroup: 'flex items-center gap-3 min-w-0',
    brandBadge: `${sizeTokens.component.badgeMini} ${sizeTokens.radius.md} ${themeTokens.brand.badge} flex items-center justify-center font-bold text-xs`,
    brandTitlesWrap: 'flex flex-col min-w-0',
    brandTitle: `${sizeTokens.typography.micro} ${themeTokens.text.primary} uppercase`,
    brandTag: themeTokens.text.accent,
    brandSubtitle: `${sizeTokens.typography.micro} ${themeTokens.text.accent}`,
    rightGroup: 'flex items-center gap-2.5 sm:gap-3 shrink-0',
    clockContainer: `hidden md:flex flex-col items-end pr-3 border-r ${themeTokens.border.default}`,
    clockDate: `${sizeTokens.typography.micro} ${themeTokens.text.muted}`,
    clockTime: `text-xs font-mono font-bold ${themeTokens.text.primary}`,
    themeButton: `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer text-lg border border-transparent hover:${themeTokens.border.default}`,
    userChip: `flex items-center gap-2 px-2.5 py-1.5 ${sizeTokens.radius.md} bg-slate-100 dark:bg-[#1f1f1f] border ${themeTokens.border.default}`,
    userAvatar: `w-7 h-7 ${sizeTokens.radius.sm} bg-[#a8071a]/15 text-[#a8071a] dark:bg-[#a8071a]/30 dark:text-[#f87171] flex items-center justify-center font-bold text-xs uppercase`,
    userName: `text-xs font-semibold ${themeTokens.text.primary} hidden sm:inline whitespace-nowrap`,
    roleTag: `px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#a8071a] text-white`,
    signOutBtn: `p-2 ${sizeTokens.radius.md} text-slate-500 hover:text-[#a8071a] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 dark:hover:text-[#f87171] transition cursor-pointer text-lg`,
  },

  hero: {
    wrapper: `mt-6 mb-10 text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b ${themeTokens.border.default} pb-8`,
    titlesWrap: 'max-w-3xl',
    tagPill: `inline-flex items-center gap-1.5 px-3 py-1 ${sizeTokens.radius.full} ${themeTokens.brand.pill} ${sizeTokens.typography.micro} mb-3`,
    pulseDot: `w-2 h-2 ${sizeTokens.radius.full} ${themeTokens.brand.pulseDot}`,
    title: `${sizeTokens.typography.pageTitle} ${themeTokens.text.primary}`,
    subtitle: `mt-2 ${sizeTokens.typography.bodySmall} ${themeTokens.text.secondary} font-normal`,
  },

  section: {
    container: 'mb-12',
    headerRow: 'mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between',
    title: `text-lg sm:text-xl font-bold ${themeTokens.text.primary} tracking-tight flex items-center gap-2.5`,
    titleIcon: `${themeTokens.text.accent} text-xl`,
    subtitle: `${sizeTokens.typography.caption} ${themeTokens.text.muted}`,
    grid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2',
    workstationsGrid:
      'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4',
  },

  card: {
    root: `group relative flex flex-col justify-between ${sizeTokens.component.cardPaddingCompact} ${sizeTokens.radius.lg} ${themeTokens.surface.cardInteractive}`,
    topRow: 'flex items-start justify-between gap-4 mb-4',
    iconWrap: `flex ${sizeTokens.component.iconBox} items-center justify-center ${sizeTokens.radius.md} ${themeTokens.brand.iconWrap} shadow-2xs transition group-hover:scale-105 shrink-0`,
    badge: `px-2.5 py-1 ${sizeTokens.radius.sm} bg-slate-50 dark:bg-[#242424] border ${themeTokens.border.default} ${themeTokens.text.secondary} ${sizeTokens.typography.micro}`,
    title: `text-base font-bold ${themeTokens.text.primary} ${themeTokens.text.accentHover} transition-colors`,
    description: `mt-2 ${sizeTokens.typography.bodySmall} ${themeTokens.text.secondary}`,
    noticeBox: `mt-4 p-3 ${sizeTokens.radius.md} ${themeTokens.brand.alertLockout} border text-xs leading-normal flex items-start gap-2`,
    noticeIcon: 'text-base shrink-0 mt-0.5',
    button: `mt-6 flex w-full items-center justify-center gap-2 py-3 px-4 ${sizeTokens.radius.md} ${themeTokens.brand.buttonPrimary} text-xs sm:text-sm font-bold`,
  },

  loadingWrap: 'flex min-h-[60vh] flex-col items-center justify-center text-center',
  spinner: `h-10 w-10 ${themeTokens.brand.spinner}`,
  loadingText: `mt-4 ${sizeTokens.typography.caption} font-semibold ${themeTokens.text.secondary}`,
  errorWrap: `mb-8 p-4 ${sizeTokens.radius.md} ${themeTokens.brand.alertError} border text-center text-xs font-semibold`,
  emptyWrap: `${sizeTokens.radius.lg} ${themeTokens.surface.card} p-8 text-center`,
  emptyText: `${sizeTokens.typography.bodySmall} ${themeTokens.text.secondary}`,
} as const;
