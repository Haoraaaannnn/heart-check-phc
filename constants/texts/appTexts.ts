/**
 * @fileoverview Global application identity, localization, and branding text constants.
 *
 * Centralizes all user-visible copy for hospital identity, header branding, and Manila
 * timezone configurations to enforce a single source of truth across the entire system.
 *
 * @remarks
 * Conforms to AGENTS.md:
 * - Manila timezone standard (Asia/Manila).
 * - Centralized under constants/texts/appTexts.ts.
 * - Strictly zero emojis in code, comments, and strings.
 *
 * @module constants/texts/appTexts
 */

/** Hospital and system branding shown in headers, banners, and footers. */
export const APP_INFO = {
  hospitalName: 'Heart Check PHC',
  tagline: 'Admin Dashboard',
  systemName: 'Heart Check PHC',
  /** Words shown in the sidebar footer, joined with a middle dot. */
  pillars: ['Care', 'Excellence', 'Hearts'],
} as const;

/**
 * All time-of-day displays must use Manila time, never raw UTC or browser timezone.
 */
export const TIMEZONE = 'Asia/Manila';

/** Locale used for date/time formatting. */
export const LOCALE = 'en-US';
