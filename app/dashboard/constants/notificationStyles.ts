/**
 * @fileoverview Style constants and Tailwind utility tokens for the enterprise
 * System Notifications Dropdown panel.
 *
 * Adheres strictly to AGENTS.md guidelines:
 * - High-contrast solid surfaces (bg-white dark:bg-[#1a1a1a], 1px crisp borders)
 * - Zero blurred glassmorphism
 * - Prohibition of text truncation (whitespace-normal, break-words)
 * - High accessibility and clear state transitions
 *
 * @module app/dashboard/constants/notificationStyles
 */

export const NOTIFICATION_STYLES = {
  /** Dropdown toggle triggers (icon bell vs text pill badge) */
  trigger: {
    iconButton:
      'relative w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#141414] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#242424] transition shadow-2xs border border-slate-200 dark:border-[#2e2e2e] cursor-pointer',
    pillButton:
      'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 dark:bg-[#141414] dark:hover:bg-[#242424] dark:text-[#f5f5f5] border border-slate-200 dark:border-[#2e2e2e] shadow-2xs transition-all cursor-pointer',
    unreadBadge:
      'absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-rose-600 rounded-md shadow-xs',
  },

  /** Dropdown floating card container */
  dropdown: {
    panel:
      'absolute right-0 mt-2 w-96 sm:w-[420px] max-h-[calc(100vh-80px)] sm:max-h-[min(560px,calc(100vh-80px))] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-[#2e2e2e] z-50 overflow-hidden',
    header:
      'bg-slate-50 dark:bg-[#242424] px-4 py-3 border-b border-slate-200 dark:border-[#2e2e2e] flex justify-between items-center shrink-0',
    headerTitle:
      'font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-[#f5f5f5] flex items-center gap-2',
    filterBar:
      'px-3 py-2 bg-slate-100/70 dark:bg-[#1f1f1f] border-b border-slate-200 dark:border-[#2e2e2e] flex items-center gap-1.5 overflow-x-auto phc-scroll shrink-0',
    filterPill:
      'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1',
    filterPillActive:
      'bg-slate-900 text-white dark:bg-slate-700 dark:text-white shadow-2xs',
    filterPillInactive:
      'text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-200 dark:hover:bg-[#2b2b2b]',
    listContainer:
      'flex-1 min-h-0 max-h-[420px] overflow-y-auto overflow-x-hidden divide-y divide-slate-100 dark:divide-[#2e2e2e] phc-scroll overscroll-contain touch-pan-y',
    emptyState:
      'px-6 py-10 text-center text-xs font-medium text-slate-400 dark:text-[#737373]',
    footer:
      'bg-slate-50/70 dark:bg-[#141414] px-4 py-2.5 border-t border-slate-200 dark:border-[#2e2e2e] flex justify-between items-center shrink-0',
  },

  /** Card surface borders and backgrounds per notification severity */
  card: {
    bottleneck: 'bg-rose-50/80 dark:bg-rose-950/40 border-l-4 border-rose-600 dark:border-rose-500',
    warning: 'bg-amber-50/80 dark:bg-amber-950/40 border-l-4 border-amber-500 dark:border-amber-400',
    info: 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 dark:border-blue-500',
    notice: 'bg-slate-100/80 dark:bg-[#242424] border-l-4 border-slate-500 dark:border-[#737373]',
  },

  /** Severity tags */
  tag: {
    bottleneck: 'text-rose-700 dark:text-rose-400 font-bold text-[11px] shrink-0',
    warning: 'text-amber-700 dark:text-amber-400 font-bold text-[11px] shrink-0',
    info: 'text-blue-700 dark:text-blue-400 font-bold text-[11px] shrink-0',
    notice: 'text-slate-600 dark:text-[#a3a3a3] font-bold text-[11px] shrink-0',
  },

  /** Item icons per severity */
  icon: {
    bottleneck: 'bx bx-error-circle text-rose-600 dark:text-rose-400 text-base',
    warning: 'bx bx-time-five text-amber-600 dark:text-amber-400 text-base',
    info: 'bx bx-info-circle text-blue-600 dark:text-blue-400 text-base',
    notice: 'bx bx-bell text-slate-500 dark:text-[#a3a3a3] text-base',
  },
} as const;

export default NOTIFICATION_STYLES;
