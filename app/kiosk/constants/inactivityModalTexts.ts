/**
 * @fileoverview Centralized text copy and accessibility labels for the Inactivity Timeout Countdown Modal.
 *
 * Provides bilingual Filipino and English copy guiding patients during inactivity countdowns,
 * with Filipino established as the priority language followed by English below.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Comprehensive symbol and module level JSDocs (Rule 1).
 * - Separation of Concerns: Text copy isolated from UI components and styling (Rule 2).
 * - Zero Emojis Standard: Strict ban on emojis in copy and comments (Rule 6).
 * - Non-Truncated Clinical Data: Plain text without abbreviation or truncation (Rule 11).
 *
 * @module app/kiosk/constants/inactivityModalTexts
 */

/**
 * Text strings and accessibility labels consumed by {@link InactivityTimeoutModal}.
 */
export const InactivityModalTexts = {
  /**
   * Primary Filipino heading asking if the patient is still present.
   */
  title: "Naririto Pa Ba Kayo?",

  /**
   * Secondary English heading directly below for bilingual clinical clarity.
   */
  subtitle: "Are You Still There?",

  /**
   * Primary Filipino explanatory description clarifying why the session is timing out.
   */
  description:
    "Malapit nang mag-expire ang iyong sesyon dahil sa kawalan ng galaw. Pindutin ang Magpatuloy upang ituloy ang iyong transaksyon, o pindutin ang Magsimula Muli upang i-clear.",

  /**
   * Secondary English explanatory description below the Filipino copy.
   */
  descriptionEnglish:
    "Your check-in session will expire soon due to inactivity. Tap Continue Session to keep your entered details, or tap Start Over to clear.",

  /**
   * Notice preceding the remaining seconds countdown in Filipino.
   */
  countdownNotice: "Magre-reset ang sesyon sa loob ng",

  /**
   * Suffix appended after the countdown seconds count in Filipino.
   */
  secondsSuffix: "segundo",

  /**
   * Singular suffix when 1 second remains.
   */
  secondsSuffixSingular: "segundo",

  /**
   * Primary action button label in Filipino.
   */
  continueButton: "Magpatuloy",

  /**
   * Subtitle on primary action button in English.
   */
  continueButtonSub: "Continue Session",

  /**
   * Secondary action button label in Filipino.
   */
  resetButton: "Magsimula Muli",

  /**
   * Subtitle on secondary action button in English.
   */
  resetButtonSub: "Start Over",

  /**
   * ARIA role description for modal dialog accessibility.
   */
  ariaRole: "alertdialog",

  /**
   * ARIA label for screen readers announcing the modal.
   */
  ariaLabel: "Inactivity Session Timeout Warning / Babala sa Pag-expire ng Sesyon",

  /**
   * ARIA live region announcement for live ticking countdown.
   */
  ariaCountdownLive: "polite",
} as const;
