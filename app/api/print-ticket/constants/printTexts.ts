/**
 * @file printTexts.ts
 * @description Centralized text constants and layout formatting strings for ESC/POS hardware thermal printing.
 *
 * @remarks
 * Adheres to AGENTS.md separation-of-concerns and zero-emoji standards.
 * Thermal receipt typography is constrained to 32 characters per line.
 */

/**
 * Text dictionary defining receipt section headers, field labels, and patient notices.
 */
export const PRINT_TEXTS = {
  /** Receipt top document header. */
  headerTitle: "QUEUE TICKET",
  /** Double-line full width boundary separator (32 characters). */
  separatorDouble: "================================\n",
  /** Single-line divider separator (32 characters). */
  separatorSingle: "--------------------------------\n",
  /** Date row label. */
  dateLabel: "Date:",
  /** Time row label. */
  timeLabel: "Time:",
  /** Philippine Standard Time zone suffix. */
  timeSuffix: "(PHT)",
  /** Clinical service row label. */
  serviceLabel: "Service:",
  /** Destination cubicle / counter row label. */
  cubicleLabel: "Cubicle:",
  /** Estimated wait time line label. */
  ewtLabel: "Est. Wait:",
  /** Filipino registration reminder line 1. */
  reminderFil1: "Mangyaring maghintay na tawagin\n",
  /** Filipino registration reminder line 2. */
  reminderFil2: "ang inyong numero sa\n",
  /** Filipino registration reminder line 3. */
  reminderFil3: "Rehistrasyon.\n\n",
  /** English registration reminder line 1. */
  reminderEn1: "Please wait for your number\n",
  /** English registration reminder line 2. */
  reminderEn2: "to be called at Registration.\n",
  /** Disclaimer clarifying that printed wait time is an approximation. */
  ewtDisclaimer: "* Oras ay pagtatantya lamang.\n",
} as const;
