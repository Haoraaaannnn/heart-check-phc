/**
 * @file kioskNewOld.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for new/old patient selection.
 */

export * from "./kioskTitle";
export * from "./patientTypeBanner";
export * from "./patientTypeCards";
export * from "./kioskNewOldLayout";
export * from "./kioskNewOldTexts";

import { KioskTitleClasses } from "./kioskTitle";
import { PatientTypeCardsClasses } from "./patientTypeCards";
import { KioskNewOldLayoutClasses } from "./kioskNewOldLayout";

/**
 * Composite class dictionary combining new/old patient selection utility classes for backward compatibility.
 */
export const KioskNewOldClasses = {
    ...KioskTitleClasses,
    ...PatientTypeCardsClasses,
    ...KioskNewOldLayoutClasses,
} as const;
