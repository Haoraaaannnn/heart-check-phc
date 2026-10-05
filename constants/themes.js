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
export const darkTheme = "dark:bg-[#1a1a1a] dark:border-[#2e2e2e] dark:shadow-sm";
export const lightTheme = "rounded-2xl shadow-sm border border-gray-200 bg-white";

export const textLight = "text-gray-800";
export const textDark = "dark:text-[#f5f5f5]";

// ---------------------------------------------------------------------------
// SEMANTIC - theme-aware via CSS variables (see app/globals.css)
// ---------------------------------------------------------------------------

/** Solid card surface: background, border, and subtle elevation shadow. Add radius/padding at the call site. */
export const cardSurface = "bg-surface border border-line shadow-sm";

/** Primary body/heading text. */
export const textPrimary = "text-content";

/** Secondary text (labels, descriptions). */
export const textMuted = "text-content-muted";

/** Tertiary text (hints, placeholders, timestamps). */
export const textSubtle = "text-content-subtle";