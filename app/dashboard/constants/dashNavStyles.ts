/**
 * @fileoverview Style dictionary for the enterprise Admin Dashboard navigation subsystem.
 *
 * Provides high-contrast solid surface tokens for the fixed desktop sidebar, mobile drawer,
 * sticky top header bar, dynamic breadcrumbs, live Manila clock, and user identity chip.
 *
 * @module app/dashboard/constants/dashNavStyles
 */

export const DASHBOARD_NAV_STYLES = {
  /** Desktop fixed sidebar rail styles */
  sidebar: {
    root: 'hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen sticky top-0 h-screen select-none transition-colors duration-200',
    brandHeader: 'p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3',
    brandBadge: 'w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 tracking-wide',
    brandTitle: 'text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider',
    brandSubtitle: 'text-[11px] font-semibold text-rose-600 dark:text-rose-400',
    navScrollArea: 'flex-1 overflow-y-auto p-4 space-y-6 phc-scroll',
    groupSection: 'space-y-1',
    groupTitle: 'px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5',
    navLink: 'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
    navLinkActive: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold shadow-2xs border border-rose-200/60 dark:border-rose-900/60',
    navLinkIdle: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60',
    navIcon: 'text-base shrink-0 transition-transform group-hover:scale-110',
    navIconActive: 'text-rose-600 dark:text-rose-400',
    footer: 'p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/30',
    statusBadge: 'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold',
    statusDot: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse',
    footerText: 'px-1 text-[10px] text-slate-400 dark:text-slate-500',
  },

  /** Responsive mobile slide-over drawer */
  drawer: {
    backdrop: 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity',
    panel: 'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl transition-transform lg:hidden',
    closeButton: 'p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
  },

  /** Top sticky header bar */
  header: {
    root: 'sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs',
    leftGroup: 'flex items-center gap-3 min-w-0',
    hamburgerButton: 'lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition',
    breadcrumbs: 'flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:flex truncate',
    breadcrumbActive: 'text-slate-900 dark:text-white font-semibold truncate',
    breadcrumbSeparator: 'text-slate-300 dark:text-slate-600 shrink-0',
    rightGroup: 'flex items-center gap-2.5 sm:gap-3 shrink-0',
    clockContainer: 'hidden md:flex flex-col items-end pr-3 border-r border-slate-200 dark:border-slate-800',
    clockDate: 'text-[11px] text-slate-500 dark:text-slate-400 font-medium',
    clockTime: 'text-xs font-mono font-bold text-slate-800 dark:text-slate-200',
    themeButton: 'p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700',
    userChip: 'flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700',
    userAvatar: 'w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold text-xs',
    userEmail: 'text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[140px] truncate',
    roleTag: 'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white',
    signOutButton: 'p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition cursor-pointer text-lg',
  },
} as const;
