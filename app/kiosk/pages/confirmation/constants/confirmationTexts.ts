/**
 * @file confirmationTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for the confirmation screen.
 */

import { ConfirmationDescriptionTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationDescriptionTexts";
import { ConfirmationActionsTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationActionsTexts";
import { ConfirmationLayoutTexts } from "@/app/kiosk/pages/confirmation/constants/confirmationLayoutTexts";

export * from "@/app/kiosk/pages/confirmation/constants/confirmationDescriptionTexts";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationActionsTexts";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationModalTexts";
export * from "@/app/kiosk/pages/confirmation/constants/confirmationLayoutTexts";

/**
 * Text copy for the service confirmation modal and fallback page.
 */
export const confirmationTexts = {
    badgeHeading: ConfirmationDescriptionTexts.badgeHeading,
    continueBtn: ConfirmationActionsTexts.continueBtn,
    cancelBtn: ConfirmationActionsTexts.cancelBtn,
    noService: ConfirmationLayoutTexts.noService,
} as const;
