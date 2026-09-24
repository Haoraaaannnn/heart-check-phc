/**
 * Heart Check PHC theme colors.
 */
export const themeColors = {
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
} as const satisfies Record<string, `#${string}`>;