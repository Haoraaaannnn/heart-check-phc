/**
 * @file kioskBackButtonTexts.ts
 * @description Centralized text constants and accessibility labels for the universal kiosk back navigation button.
 */

/**
 * Text strings and accessibility labels consumed by {@link KioskBackButton}.
 */
export const KioskBackButtonTexts = {
    /**
     * Default label displayed on the primary navigation back button.
     */
    label: "Bumalik - Back",

    /**
     * Accessible ARIA label for screen readers on the navigation back button.
     */
    ariaLabel: "Bumalik sa nakaraang hakbang - Return to the previous step",
} as const;
