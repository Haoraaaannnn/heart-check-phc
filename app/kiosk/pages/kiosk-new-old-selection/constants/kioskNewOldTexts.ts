/**
 * @file kioskNewOldTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for the new vs old patient selection.
 */

import { KioskTitleTexts } from "./kioskTitleTexts";
import { PatientTypeBannerTexts } from "./patientTypeBannerTexts";

export * from "./kioskTitleTexts";
export * from "./patientTypeBannerTexts";

/**
 * Composite text copy dictionary for new/old patient category selection.
 */
export const kioskNewOldTexts = {
    ...KioskTitleTexts,
    ...PatientTypeBannerTexts,
} as const;
