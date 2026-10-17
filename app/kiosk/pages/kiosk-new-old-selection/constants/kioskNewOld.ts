/**
 * @file kioskNewOld.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for new/old patient selection.
 */

export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle";
export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBanner";
export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeCards";
export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout";
export * from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldTexts";

import { KioskTitleClasses } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle";
import { PatientTypeCardsClasses } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeCards";
import { KioskNewOldLayoutClasses } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout";

/**
 * Composite class dictionary combining new/old patient selection utility classes for backward compatibility.
 */
export const KioskNewOldClasses = {
    ...KioskTitleClasses,
    ...PatientTypeCardsClasses,
    ...KioskNewOldLayoutClasses,
} as const;
