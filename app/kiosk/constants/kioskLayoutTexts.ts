/**
 * @file kioskLayoutTexts.ts
 * @description Centralized text constants and accessibility labels for the main kiosk shell layout.
 *
 * @remarks
 * Component-specific text constants are organized in dedicated files (`kioskBackButtonTexts.ts`,
 * `kioskLoadingOverlayTexts.ts`) and re-exported here for backwards compatibility.
 */

import { KioskBackButtonTexts } from "./kioskBackButtonTexts";
import { KioskLoadingOverlayTexts } from "./kioskLoadingOverlayTexts";

export * from "./kioskBackButtonTexts";
export * from "./kioskLoadingOverlayTexts";

/**
 * Text strings and accessibility labels consumed by the root kiosk layout and overlays.
 */
export const KioskLayoutTexts = {
    /** Default label displayed on the primary navigation back button. */
    backButtonLabel: KioskBackButtonTexts.label,

    /** Accessible ARIA label for screen readers on the navigation back button. */
    backButtonAriaLabel: KioskBackButtonTexts.ariaLabel,

    /** Default loading feedback text displayed under the kiosk activity spinner. */
    defaultLoadingMessage: KioskLoadingOverlayTexts.defaultMessage,

    /** Screen reader role attribute for the loading status overlay. */
    loadingAriaRole: KioskLoadingOverlayTexts.ariaRole,

    /** Screen reader live region attribute for the loading status overlay. */
    loadingAriaLive: KioskLoadingOverlayTexts.ariaLive,
} as const;
