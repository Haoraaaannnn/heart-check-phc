/**
 * Shared theme class strings.
 *
 * Two generations live here on purpose:
 *  1. LEGACY exports (darkTheme, lightTheme, textLight, textDark) - still
 *     imported by older pages/components. Do not remove until those are migrated.
 *  2. SEMANTIC exports (cardSurface, textPrimary, ...) - built on the CSS tokens
 *     in app/globals.css. They adapt to light/dark automatically, so consumers
 *     never add `dark:` variants for these.
 */

// ---------------------------------------------------------------------------
// LEGACY - bg / text themes applicable to all especially on dashboard
// ---------------------------------------------------------------------------
export const darkTheme = "dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20";
export const lightTheme = "rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] border border-white/40 bg-white/35";

export const textLight = "text-gray-800";
export const textDark = "dark:text-gray-200";

// ---------------------------------------------------------------------------
// SEMANTIC - theme-aware via CSS variables (see app/globals.css)
// ---------------------------------------------------------------------------

/** Glass card surface: background, border, shadow and blur. Add radius/padding at the call site. */
export const cardSurface = "bg-surface border border-line shadow-card backdrop-blur-xl";

/** Primary body/heading text. */
export const textPrimary = "text-content";

/** Secondary text (labels, descriptions). */
export const textMuted = "text-content-muted";

/** Tertiary text (hints, placeholders, timestamps). */
export const textSubtle = "text-content-subtle";