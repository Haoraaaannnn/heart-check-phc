/**
 * @file kioskNewOldTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for the new vs old patient selection.
 */

import { KioskTitleTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitleTexts";
import { PatientTypeBannerTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBannerTexts";

export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitleTexts";
export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBannerTexts";

/**
 * Composite text copy dictionary for new/old patient category selection.
 */
export const kioskNewOldTexts = {
    ...KioskTitleTexts,
    ...PatientTypeBannerTexts,
} as const;
