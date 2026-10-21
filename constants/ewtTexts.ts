/**
 * @file ewtTexts.ts
 * @description Centralized Estimated Wait Time (EWT) range definitions, bilingual labels, and formatting utilities.
 *
 * Implements human-friendly wait time ranges specified in docs/specifications/ESTIMATED_WAIT_TIME.md
 * to eliminate false precision across kiosk screens, thermal receipt prints, and SMS notifications.
 *
 * Adheres to AGENTS.md separation-of-concerns and zero-emoji standards.
 *
 * @module constants/ewtTexts
 */

/**
 * Text dictionary defining customer-facing Estimated Wait Time copy across interfaces.
 */
export const EWT_TEXTS = {
  /** Screen section title. */
  sectionLabel: 'Estimated Wait Time',
  /** Screen section title in Filipino. */
  sectionLabelFil: 'Tinatayang Oras ng Paghihintay',
  /** Screen and receipt disclaimer clarifying that wait times are approximations. */
  disclaimer: 'This is an estimate only. Your actual wait may vary depending on clinic conditions.',
  /** Filipino disclaimer. */
  disclaimerFil: 'Ang oras ay pagtatantya lamang at maaaring magbago depende sa dami ng pasyente.',
  /** Real-time computation placeholder. */
  calculating: 'Calculating...',
  /** Real-time computation placeholder in Filipino. */
  calculatingFil: 'Kinakalkula...',
  /** Fallback when wait time cannot be determined. */
  unavailable: 'Unavailable',
  /** Range: 0 to 9 minutes. */
  lessThan10: 'Less than 10 minutes',
  /** Range: 10 to 29 minutes. */
  about10to30: 'About 10 to 30 minutes',
  /** Range: 30 to 59 minutes. */
  about30to60: 'About 30 minutes to 1 hour',
  /** Range: 60 to 119 minutes. */
  about1to2Hours: 'About 1 to 2 hours',
  /** Range: 2 to 3 hours (120 to 180 minutes). */
  about2to3Hours: 'About 2 to 3 hours',
  /** Range: Exceeding 180 minutes. */
  moreThan3Hours: 'More than 3 hours',
} as const;

/**
 * Formats a raw numeric wait time in minutes into a human-friendly range string for kiosk displays.
 *
 * @param minutes - Raw wait time in minutes computed from queue depth.
 * @returns Formatted human-readable wait time range.
 */
export function formatEwtLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return EWT_TEXTS.calculating;
  }

  if (minutes < 10) return EWT_TEXTS.lessThan10;
  if (minutes < 30) return EWT_TEXTS.about10to30;
  if (minutes < 60) return EWT_TEXTS.about30to60;
  if (minutes < 120) return EWT_TEXTS.about1to2Hours;
  if (minutes <= 180) return EWT_TEXTS.about2to3Hours;
  return EWT_TEXTS.moreThan3Hours;
}

/**
 * Formats a raw wait time in minutes into a condensed string fit for 32-character thermal receipts.
 *
 * @param minutes - Raw wait time in minutes.
 * @returns Condensed thermal receipt label prefixed with an approximation indicator.
 */
export function formatEwtReceiptLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return 'Unavailable';
  }

  if (minutes < 10) return '< 10 minutes';
  if (minutes < 30) return '~10-30 minutes';
  if (minutes < 60) return '~30 min - 1 hr';
  if (minutes < 120) return '~1 to 2 hours';
  if (minutes <= 180) return '~2 to 3 hours';
  return '> 3 hours';
}

/**
 * Formats a raw wait time in minutes into a natural Filipino/Taglish string for outbound SMS alerts.
 *
 * @param minutes - Raw wait time in minutes.
 * @returns Taglish SMS wait range.
 */
export function formatEwtSmsLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return 'mga 15 hanggang 30 minuto';
  }

  if (minutes < 10) return 'wala pang 10 minuto';
  if (minutes < 30) return '~10 hanggang 30 minuto';
  if (minutes < 60) return '~30 minuto hanggang 1 oras';
  if (minutes < 120) return '~1 hanggang 2 oras';
  if (minutes <= 180) return '~2 hanggang 3 oras';
  return 'higit sa 3 oras';
}
