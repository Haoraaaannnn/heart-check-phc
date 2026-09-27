/**
 * Heart Check PHC theme colors.
 *
 * All reusable hex values live here so that every component
 * references a single source of truth instead of inline literals.
 */
export const themeColors = {
    /* ── Red palette ───────────────────────────────────── */
    lightRed: "#f15b6c",
    roseRed: "#d9364b",
    brightRed: "#c9142b",
    brandRed: "#a8071a",
    deepRed: "#76000d",

    /**
     * Kept for compatibility with existing kiosk components.
     */
    DarkRed: "#4d0008",

    /**
     * Existing bright red token.
     */
    brightRedLegacy: "#fd0e19",

    /* ── Accent / Utility ──────────────────────────────── */

    /** Sky blue — used for pediatric category distinction. */
    skyBlue: "#0284c7",

    /** Pure white — icon fills, footer text, etc. */
    white: "#ffffff",

    /** Pure black — banner headings. */
    black: "#000000",
} as const satisfies Record<string, `#${string}`>;