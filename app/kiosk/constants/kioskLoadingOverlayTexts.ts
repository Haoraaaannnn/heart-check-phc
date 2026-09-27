/**
 * @file kioskLoadingOverlayTexts.ts
 * @description Centralized text constants and accessibility attributes for the full-screen kiosk loading overlay.
 */

/**
 * Text strings and accessibility attributes consumed by {@link KioskLoadingOverlay}.
 */
export const KioskLoadingOverlayTexts = {
    /**
     * Default loading feedback text displayed under the kiosk activity spinner.
     */
    defaultMessage: "Loading, please wait...",

    /**
     * Screen reader role attribute for the loading status overlay.
     */
    ariaRole: "status",

    /**
     * Screen reader live region attribute for the loading status overlay.
     */
    ariaLive: "polite",
} as const;
