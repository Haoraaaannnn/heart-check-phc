/**
 * @fileoverview Style tokens and screen options configuration for the Screen Display Selector.
 *
 * Defines screen definitions, role permissions, layout style mappings, and interactive tokens.
 *
 * @module app/select-screen/constants/selectScreen
 */

import { ScreenOption } from '../types/selectScreen';
import { SELECT_SCREEN_TEXTS } from './selectScreenTexts';

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
export const REGISTRATION_ROLES: string[] = ['registration', 'nurse', 'staff', 'admin', 'superadmin'];

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
 */
export const SELECT_SCREEN_STYLES = {
  page: 'relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#fffdfd] via-[#fff5f5] to-[#ffeaea] font-sans text-gray-800',
  blurBlobs: {
    blob1: 'absolute top-[-100px] right-[-80px] h-[480px] w-[480px] rounded-full bg-[#ff6b6b]/20 blur-[130px] pointer-events-none',
    blob2: 'absolute top-[35%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8a8a]/15 blur-[150px] pointer-events-none',
    blob3: 'absolute bottom-[-140px] left-[-80px] h-[450px] w-[450px] rounded-full bg-[#ffd6d6]/25 blur-[130px] pointer-events-none',
  },
  container: 'relative z-10 mx-auto max-w-6xl px-6 py-10 sm:px-10',
  header: {
    nav: 'flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/40 px-6 py-4 backdrop-blur-xl shadow-[0_4px_20px_rgba(255,100,100,0.05)]',
    brand: 'text-xl font-bold tracking-tight text-gray-800',
    brandAccent: 'text-[#cc3535]',
    userInfo: 'flex items-center gap-3',
    userText: 'text-sm font-medium text-gray-600',
    roleBadge: 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wider',
    signOutBtn: 'rounded-xl border border-red-200 bg-white/70 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 active:scale-95 cursor-pointer',
  },
  hero: {
    wrapper: 'mt-10 mb-10 text-center',
    title: 'text-3xl sm:text-4xl font-black text-gray-900 tracking-tight',
    subtitle: 'mx-auto mt-3 max-w-2xl text-base text-gray-600 leading-relaxed',
  },
  section: {
    container: 'mb-12',
    headerRow: 'mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between',
    title: 'text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2',
    subtitle: 'text-xs text-gray-500 font-medium',
    grid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2',
    workstationsGrid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
  },
  card: {
    root: 'group relative flex flex-col justify-between rounded-3xl border border-white/70 bg-white/50 p-7 shadow-[0_8px_30px_rgba(204,53,53,0.06)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_12px_36px_rgba(204,53,53,0.12)]',
    topRow: 'flex items-start justify-between gap-4 mb-4',
    iconWrap: 'flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white text-[#cc3535] shadow-sm transition group-hover:scale-110 group-hover:bg-[#cc3535] group-hover:text-white',
    badge: 'rounded-full border border-gray-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-600 backdrop-blur-md',
    title: 'text-lg font-bold text-gray-900 group-hover:text-[#cc3535] transition',
    description: 'mt-2 text-sm leading-relaxed text-gray-600',
    noticeBox: 'mt-4 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 text-xs leading-normal text-amber-800',
    button: 'mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#cc3535] px-6 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(204,53,53,0.2)] transition hover:bg-red-700 active:scale-95 cursor-pointer',
  },
  loadingWrap: 'flex min-h-[60vh] flex-col items-center justify-center text-center',
  spinner: 'h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-[#cc3535]',
  errorWrap: 'mt-8 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-center text-sm font-medium text-red-800',
} as const;
