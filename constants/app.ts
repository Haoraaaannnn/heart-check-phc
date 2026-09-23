/**
 * Global app identity + locale constants.
 * Anything user-visible about the hospital/system name lives here so it is
 * changed in exactly one place.
 */

/** Hospital and system branding shown in headers, banners and footers. */
export const APP_INFO = {
  hospitalName: 'Heart Check PHC',
  tagline: 'Admin Dashboard',
  systemName: 'Heart Check PHC',
  /** Words shown in the sidebar footer, joined with a middle dot. */
  pillars: ['Care', 'Excellence', 'Hearts'],
} as const;

/**
 * All time-of-day display must use Manila time, never the raw UTC value or the
 * viewer's browser timezone (see project principle: Asia/Manila throughout).
 */
export const TIMEZONE = 'Asia/Manila';

/** Locale used for date/time formatting. */
export const LOCALE = 'en-US';