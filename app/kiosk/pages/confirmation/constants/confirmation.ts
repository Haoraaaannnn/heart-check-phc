/**
 * @file confirmation.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for the confirmation feature.
 */

export * from "@/app/kiosk/pages/confirmation/constants/confirmationBanner";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationDescription";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationActions";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationModal";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationLayout";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationTexts";

import { ConfirmationBannerStyle, ConfirmationBannerClasses } from "@/app/kiosk/pages/confirmation/constants/confirmationBanner";
import { ConfirmationDescriptionStyle } from "@/app/kiosk/pages/confirmation/constants/confirmationDescription";
import { ConfirmationActionsStyle, ConfirmationActionsClasses } from "@/app/kiosk/pages/confirmation/constants/confirmationActions";
import { ConfirmationModalStyle, ConfirmationModalClasses } from "@/app/kiosk/pages/confirmation/constants/confirmationModal";
import { ConfirmationLayoutStyle, ConfirmationLayoutClasses } from "@/app/kiosk/pages/confirmation/constants/confirmationLayout";

/**
 * Composite class dictionary combining confirmation utility classes for backward compatibility.
 */
export const ConfirmationClasses = {
    ...ConfirmationBannerClasses,
    ...ConfirmationActionsClasses,
    ...ConfirmationModalClasses,
    ...ConfirmationLayoutClasses,
} as const;
