/**
 * @fileoverview Visual styles, layout tokens, and Tailwind utility classes for the Inactivity Timeout Countdown Modal.
 *
 * Implements high-contrast solid clinical surfaces, crisp 1px borders, enlarged modal dimensions,
 * Heart Check PHC brand red color palette (#a8071a / #c9142b), and prominent tactile touch targets
 * for elderly and hesitant patients per AGENTS.md rules.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full symbol and module level JSDocs (Rule 1).
 * - Separation of Concerns: Visual properties isolated from component logic (Rule 2).
 * - Kiosk UI Centering Standard: Dialog centered vertically and horizontally (Rule 9).
 * - High-Contrast Solid Surfaces: Solid clinical backgrounds, zero blurry glassmorphism (Rule 10).
 * - Zero Emojis Standard: Replaced with Boxicons and clean text (Rule 6).
 *
 * @module app/kiosk/constants/inactivityModalStyles
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/**
 * Dedicated color tokens for the inactivity countdown progress ring.
 */
export const InactivityTimerColors = {
  /** Soft clinical grayish track representing depleted/empty countdown seconds. */
  emptyTrack: "#E2E8F0",
  /** Dark mode track stroke color. */
  emptyTrackDark: "#334155",
  /** PHC brand red active progress ring stroke. */
  brandRed: themeColors.brandRed,
  /** Urgent bright red progress ring stroke for the critical final 5 seconds. */
  brightRed: themeColors.brightRed,
} as const;

/**
 * Static presentation style mappings for the inactivity warning modal.
 */
export const InactivityModalStyles = {
  /**
   * Fixed overlay backdrop container.
   */
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 250,
  },

  /**
   * Main dialog card surface styling with enlarged max width and PHC red top accent border.
   */
  card: {
    maxWidth: "36rem",
    width: "100%",
  },

  /**
   * Enlarged countdown SVG canvas dimensions (128px x 128px).
   */
  svgCanvas: {
    width: "8rem",
    height: "8rem",
  },

  /**
   * Primary action button using official PHC brand red color token.
   */
  continueButton: {
    backgroundColor: themeColors.brandRed,
    color: themeColors.white,
    borderColor: "#8e0616",
  },

  /**
   * Secondary action button with tactile solid surface.
   */
  resetButton: {
    backgroundColor: themeColors.white,
    borderColor: "#CBD5E1",
  },
} satisfies Record<string, CSSProperties>;

/**
 * Tailwind utility class names for {@link InactivityTimeoutModal}.
 */
export const InactivityModalClasses = {
  /**
   * Full-screen backdrop scrim with high-contrast darkening and centered flex layout.
   */
  backdrop:
    "fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200",

  /**
   * Enlarged modal dialog card with solid clinical background, uniform border, and shadow.
   */
  card:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-[94vw] max-w-[560px] sm:max-w-xl p-6 sm:p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200",

  /**
   * Enlarged circular alert icon box styled with PHC brand red tone and subtle border.
   */
  iconWrap:
    "w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-[#a8071a] dark:text-[#f15b6c] text-4xl mb-4 shrink-0 shadow-sm",

  /**
   * Enlarged primary English heading typography.
   */
  title:
    "text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white break-words tracking-tight leading-tight",

  /**
   * Secondary Filipino heading in PHC brand red.
   */
  subtitle:
    "text-sm sm:text-base font-bold text-[#a8071a] dark:text-[#f15b6c] mt-1.5 uppercase tracking-wider",

  /**
   * Enlarged primary explanatory paragraph copy.
   */
  description:
    "text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-3 break-words whitespace-normal leading-relaxed max-w-lg",

  /**
   * Secondary English translation paragraph copy.
   */
  descriptionEnglish:
    "text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 italic break-words whitespace-normal leading-normal max-w-lg",

  /**
   * Central countdown container organizing the circular progress ring and numerical display.
   */
  timerWrapper:
    "my-6 sm:my-8 flex flex-col items-center justify-center relative",

  /**
   * Transparent circular container framing the countdown progress ring.
   */
  timerCircleWrapper:
    "relative flex items-center justify-center w-32 h-32",

  /**
   * Centered container framing the numerical countdown digits without background tint or shadow.
   */
  timerCenterDisc:
    "absolute inset-0 flex items-center justify-center pointer-events-none",

  /**
   * Large bold remaining seconds text centered inside the circular countdown progress ring.
   */
  timerCountText:
    "text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight",

  /**
   * Notice text below the countdown circle.
   */
  countdownNotice:
    "mt-3 text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2",

  /**
   * Pill badge highlighting remaining seconds with PHC red branding.
   */
  countdownBadge:
    "font-bold text-[#a8071a] dark:text-[#f15b6c] bg-red-50 dark:bg-red-950/50 px-3 py-1 rounded-lg border border-red-200 dark:border-red-900/60",

  /**
   * Responsive two-button actions grid with guaranteed equal 50/50 sizing across columns.
   */
  actionsGrid:
    "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full mt-2 sm:mt-4",

  /**
   * Primary "Continue Session" action button with equal width, enlarged touch sizing, PHC brand red, and high contrast.
   */
  continueButton:
    "w-full min-h-[66px] sm:min-h-[74px] py-4 px-5 sm:px-6 rounded-2xl bg-[#a8071a] hover:bg-[#c9142b] active:bg-[#76000d] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border-2 border-[#8e0616] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a8071a] focus-visible:ring-offset-2",

  /**
   * Subtitle under primary button text.
   */
  continueSub:
    "text-xs sm:text-sm font-medium text-red-100 opacity-95",

  /**
   * Secondary "Start Over" action button with equal width, solid surface, and subtle border.
   */
  resetButton:
    "w-full min-h-[66px] sm:min-h-[74px] py-4 px-5 sm:px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base sm:text-lg transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer border-2 border-slate-300 dark:border-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",

  /**
   * Subtitle under secondary button text.
   */
  resetSub:
    "text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400",
} as const;
