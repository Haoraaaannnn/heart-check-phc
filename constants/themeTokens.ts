/**
 * @fileoverview Central theme and sizing token dictionary for enterprise surfaces.
 *
 * Provides a single centralized source of truth for all surface themes, pure neutral grayish
 * dark mode palettes (#0d0d0d, #141414, #1a1a1a, #242424, #2e2e2e), typography scales,
 * and component sizing tokens across the Heart Check PHC application.
 *
 * @remarks
 * Conforms to AGENTS.md: zero bluish slate cast, zero unwanted red background tints,
 * pure neutral dark mode surfaces (R=G=B), crisp 1-pixel borders, and strict separation of concerns.
 * All feature style files import and call these centralized tokens.
 *
 * @module constants/themeTokens
 */

import { themeColors } from './colors';

/**
 * Universal theme tokens for surface backgrounds, cards, borders, text, and brand colors.
 */
export const themeTokens = {
  /** Root viewport and page container backgrounds */
  page: 'relative min-h-screen bg-slate-50 dark:bg-[#0d0d0d] text-slate-900 dark:text-[#f5f5f5] font-sans selection:bg-[#a8071a]/20 selection:text-[#a8071a] transition-colors duration-200',

  /** Solid surfaces and container backgrounds */
  surface: {
    /** High-contrast solid card surface */
    card: 'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-xs transition-colors duration-200',
    /** Interactive card with hover elevation and subtle brand border highlight */
    cardInteractive:
      'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-xs hover:border-[#a8071a]/40 dark:hover:border-[#a8071a]/50 hover:shadow-md transition-all duration-200',
    /** Top sticky navigation header bar */
    header:
      'sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2e2e2e] shadow-2xs transition-colors duration-200',
    /** Secondary recessed container / inner well */
    well: 'bg-slate-50 dark:bg-[#242424] border border-slate-200 dark:border-[#2e2e2e] transition-colors duration-200',
    /** Recessed interactive input surface */
    input:
      'bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2e2e2e] text-slate-900 dark:text-[#f5f5f5] placeholder:text-slate-400 dark:placeholder:text-[#737373] focus:border-[#a8071a] focus:outline-hidden focus:ring-2 focus:ring-[#a8071a]/20 transition-all duration-150',
    /** Footer container */
    footer:
      'bg-white dark:bg-[#141414] border-t border-slate-200 dark:border-[#2e2e2e] transition-colors duration-200',
    /** Desktop navigation sidebar rail */
    sidebar:
      'bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#2e2e2e] transition-colors duration-200',
    /** Mobile slide-over drawer panel */
    drawerPanel:
      'bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-[#2e2e2e] shadow-2xl transition-transform',
    /** Modal dialog panel */
    modal:
      'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-xl transition-colors duration-200',
    /** Floating dropdown menu */
    dropdown:
      'bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] shadow-xl',
    /** Interactive hover surface */
    hover: 'hover:bg-slate-100 dark:hover:bg-[#242424] transition-colors duration-150',
    /** Table row hover */
    tableRowHover: 'hover:bg-slate-50/70 dark:hover:bg-[#242424]/60 transition-colors duration-150',
    /** Form select option element styling */
    selectOption: 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-[#f5f5f5]',
    /** Modal and drawer backdrop */
    backdrop: 'bg-black/70 backdrop-blur-xs',
  },

  /** Crisp 1-pixel border lines */
  border: {
    default: 'border-slate-200 dark:border-[#2e2e2e]',
    subtle: 'border-slate-100 dark:border-[#242424]',
    interactive: 'hover:border-[#a8071a]/40 dark:hover:border-[#a8071a]/50',
  },

  /** Centralized typography colors */
  text: {
    primary: 'text-slate-900 dark:text-[#f5f5f5]',
    secondary: 'text-slate-600 dark:text-[#a3a3a3]',
    muted: 'text-slate-400 dark:text-[#737373]',
    accent: 'text-[#a8071a] dark:text-[#f87171]',
    accentHover: 'hover:text-[#a8071a] dark:hover:text-[#f87171]',
  },

  /** Philippine Heart Center darkish red brand accents */
  brand: {
    red: themeColors.brandRed,
    deepRed: themeColors.deepRed,
    badge:
      'bg-gradient-to-br from-[#76000d] to-[#a8071a] text-white shadow-xs tracking-wide shrink-0',
    buttonPrimary:
      'bg-[#a8071a] hover:bg-[#8e0616] active:bg-[#76000d] text-white font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
    iconWrap:
      'bg-[#a8071a]/10 dark:bg-[#a8071a]/20 border border-[#a8071a]/25 text-[#a8071a] dark:text-[#f87171] shrink-0',
    spinner:
      'animate-spin rounded-full border-4 border-slate-200 dark:border-[#2e2e2e] border-t-[#a8071a]',
    alertError:
      'border-[#a8071a]/25 dark:border-[#a8071a]/30 bg-[#a8071a]/10 dark:bg-[#a8071a]/20 text-[#a8071a] dark:text-[#f87171]',
    alertLockout:
      'border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
  },
} as const;

/**
 * Universal size tokens for typography scales, corner radii, and component dimensions.
 */
export const sizeTokens = {
  /** Typography scale tokens */
  typography: {
    heroTitle:
      'text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight',
    pageTitle: 'text-2xl sm:text-3xl font-black tracking-tight',
    sectionTitle: 'text-2xl sm:text-4xl font-extrabold tracking-tight',
    sectionSubtitle: 'text-sm sm:text-base leading-relaxed',
    cardTitle: 'text-base sm:text-lg font-bold tracking-tight',
    body: 'text-sm sm:text-base leading-relaxed',
    bodySmall: 'text-xs sm:text-sm leading-relaxed',
    caption: 'text-xs font-medium',
    micro: 'text-[11px] font-semibold tracking-wide',
  },

  /** Standard corner radii */
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  /** Standard component sizing tokens */
  component: {
    headerHeight: 'h-16',
    badgeSquare: 'w-10 h-10',
    badgeSmall: 'w-7 h-7',
    badgeMini: 'w-9 h-9',
    iconBox: 'w-12 h-12',
    inputPadding: 'px-4 py-3',
    buttonPadding: 'px-6 py-3.5',
    buttonCompactPadding: 'px-4 py-2',
    cardPadding: 'p-6 sm:p-7',
    cardPaddingCompact: 'p-6',
  },
} as const;
