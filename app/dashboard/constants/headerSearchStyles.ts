/**
 * @fileoverview Styling dictionaries and layout tokens for the Admin Dashboard Header Search.
 *
 * Implements high-contrast solid surfaces, crisp 1-pixel borders, responsive
 * breakpoints, and flawless dual-theme support conforming to AGENTS.md.
 *
 * @module app/dashboard/constants/headerSearchStyles
 */

import { themeTokens, sizeTokens } from '@/constants/themeTokens';

/**
 * Visual styling dictionary for HeaderSearch component and its dropdown palette.
 */
export const HEADER_SEARCH_STYLES = {
  /** Root wrapper layout */
  root: 'relative flex items-center',

  /** Desktop search container in top navigation bar */
  desktopContainer:
    'hidden md:flex items-center mx-2 sm:mx-3 max-w-xs md:max-w-sm lg:max-w-md w-full relative',

  /** Mobile trigger icon button in top navigation bar */
  mobileTriggerButton:
    'md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#242424] transition cursor-pointer text-lg border border-transparent',

  /** Mobile fullscreen/sheet overlay backdrop */
  mobileOverlayBackdrop:
    'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col md:hidden p-3 pt-3',

  /** Mobile modal panel container */
  mobileOverlayContainer:
    'w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]',

  /** Mobile modal header bar */
  mobileOverlayHeader:
    'flex items-center gap-2 p-3 border-b border-slate-200 dark:border-[#2e2e2e]',

  /** Mobile modal title */
  mobileOverlayTitle:
    'text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#a3a3a3] flex-1',

  /** Mobile close icon button */
  mobileCloseButton:
    'p-2 text-slate-400 hover:text-slate-700 dark:hover:text-[#f5f5f5] rounded-lg transition cursor-pointer',

  /** Input wrapper container */
  inputWrapper: 'relative w-full flex items-center',

  /** Search icon */
  searchIcon:
    'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-[#737373] pointer-events-none',

  /** Active database query spinner */
  spinnerIcon:
    'absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a8071a] dark:text-[#f87171] animate-spin pointer-events-none',

  /** Search input element */
  input: `w-full ${sizeTokens.radius.md} border ${themeTokens.border.default} bg-slate-50 dark:bg-[#1f1f1f] py-1.5 pl-8 pr-16 text-xs ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:border-[#a8071a] focus:bg-white dark:focus:bg-[#141414] focus:outline-hidden focus:ring-1 focus:ring-[#a8071a]/30 transition`,

  /** Mobile input element */
  mobileInput: `w-full ${sizeTokens.radius.md} border ${themeTokens.border.default} bg-slate-50 dark:bg-[#1f1f1f] py-2 pl-9 pr-9 text-sm ${themeTokens.text.primary} placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:border-[#a8071a] focus:outline-hidden transition`,

  /** Clear search query button */
  clearButton:
    'absolute right-9 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#e5e5e5] rounded transition cursor-pointer text-sm flex items-center justify-center',

  /** Mobile clear query button */
  mobileClearButton:
    'absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#e5e5e5] rounded transition cursor-pointer text-base flex items-center justify-center',

  /** Keyboard shortcut badge inside desktop search input */
  shortcutBadge: `absolute right-2.5 top-1/2 -translate-y-1/2 rounded border ${themeTokens.border.default} px-1.5 py-0.5 text-[10px] font-semibold ${themeTokens.text.muted} pointer-events-none select-none`,

  /** Floating dropdown panel for desktop */
  dropdown:
    'absolute left-0 top-full mt-1.5 w-[380px] sm:w-[440px] md:w-[480px] bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#2e2e2e] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[460px] transition-all duration-150',

  /** Scrollable results area */
  scrollArea:
    'overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-[#242424]',

  /** Section group wrapper */
  groupSection: 'py-1',

  /** Section group header */
  groupHeader:
    'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#8c8c8c] flex items-center justify-between select-none bg-slate-50/70 dark:bg-[#1a1a1a]/60',

  /** Result item container */
  resultItem:
    'flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition select-none text-slate-700 dark:text-[#d4d4d4]',

  /** Active/highlighted item state */
  resultItemActive:
    'bg-rose-50/70 dark:bg-[#241719] text-slate-900 dark:text-[#f5f5f5]',

  /** Idle item state */
  resultItemIdle: 'hover:bg-slate-50 dark:hover:bg-[#1a1a1a]',

  /** Icon box for navigation links */
  itemIconBox:
    'w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#242424] text-slate-600 dark:text-[#a3a3a3] flex items-center justify-center text-sm shrink-0 transition',

  /** Active icon box state */
  itemIconBoxActive:
    'bg-[#a8071a]/15 text-[#a8071a] dark:bg-[#a8071a]/30 dark:text-[#f87171]',

  /** Item text content wrapper */
  itemContent: 'flex-1 min-w-0',

  /** Item title layout row */
  itemTitleRow: 'flex items-center gap-2 flex-wrap',

  /** Item primary title */
  itemTitle: 'font-semibold text-slate-900 dark:text-[#f5f5f5] whitespace-normal',

  /** Item secondary subtitle or metadata */
  itemSubtitle: 'text-[11px] text-slate-500 dark:text-[#8c8c8c] whitespace-normal',

  /** Ticket number pill badge */
  ticketBadge:
    'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 shrink-0',

  /** Service pill badge */
  serviceBadge:
    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#d4d4d4] border border-slate-200 dark:border-[#2e2e2e]',

  /** Category tag badge */
  categoryBadge:
    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#242424] text-slate-500 dark:text-[#a3a3a3]',

  /** Status badge dictionaries */
  statusBadges: {
    waiting:
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
    serving:
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
    done:
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
    idle:
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-[#242424] dark:text-[#a3a3a3] border border-slate-200 dark:border-[#2e2e2e]',
  },

  /** Empty state wrapper */
  emptyContainer: 'p-6 text-center space-y-2 select-none',

  /** Empty state icon */
  emptyIcon: 'text-3xl text-slate-300 dark:text-[#525252]',

  /** Empty state title */
  emptyTitle: 'text-xs font-bold text-slate-800 dark:text-[#e5e5e5]',

  /** Empty state description */
  emptyDesc: 'text-[11px] text-slate-500 dark:text-[#8c8c8c]',

  /** Empty state action button */
  emptyActionBtn:
    'mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#a8071a] hover:bg-[#8e0616] text-white shadow-xs transition cursor-pointer',

  /** Dropdown footer command bar */
  footerBar:
    'px-3 py-2 bg-slate-50 dark:bg-[#1a1a1a] border-t border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8c8c8c] select-none',

  /** Keyboard hint group */
  footerKbdGroup: 'flex items-center gap-2',

  /** Keyboard keycap styling */
  footerKbd:
    'px-1 py-0.5 rounded bg-slate-200 dark:bg-[#2b2b2b] text-[10px] font-mono font-medium text-slate-700 dark:text-[#d4d4d4]',
} as const;

/**
 * Returns the appropriate Tailwind badge styling class based on patient operational status.
 *
 * @param status - Raw or normalized queue status string.
 * @returns CSS class name string for the status badge.
 */
export function getStatusBadgeClass(status: string): string {
  const s = (status || '').toLowerCase().trim();
  if (['waiting', 'in queue', 'pending', 'assigned'].includes(s)) {
    return HEADER_SEARCH_STYLES.statusBadges.waiting;
  }
  if (['serving', 'in service', 'consulting', 'on progress'].includes(s)) {
    return HEADER_SEARCH_STYLES.statusBadges.serving;
  }
  if (['done', 'served', 'completed'].includes(s)) {
    return HEADER_SEARCH_STYLES.statusBadges.done;
  }
  return HEADER_SEARCH_STYLES.statusBadges.idle;
}

export default HEADER_SEARCH_STYLES;
