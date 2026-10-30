/**
 * @file cubicleCardTexts.ts
 * @description Centralized text constants for `CubicleCard` in Kiosk cubicle selection.
 *
 * Defines all user-facing strings including doctor title prefixes and fallbacks.
 */

/**
 * Text copy dictionary for cubicle selection cards.
 */
export const CubicleCardTexts = {
    /** Doctor title prefix displayed before physician names. */
    doctorPrefix: "Dr.",
    /** Fallback text when no physician is assigned to the station. */
    unassignedDoctor: "Walang Nakatalagang Doktor",
    /** Short label displayed on the floating scroll down badge. */
    scrollDownBadgeShort: "Pindutin para bumaba",
    /** Accessibility label for scroll down action. */
    scrollDownAria: "Mag-scroll pababa para sa higit pang doktor",
} as const;
