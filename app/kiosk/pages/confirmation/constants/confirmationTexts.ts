/**
 * @file confirmationTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for the confirmation screen.
 */

import { ConfirmationDescriptionTexts } from "./confirmationDescriptionTexts";
import { ConfirmationActionsTexts } from "./confirmationActionsTexts";
import { ConfirmationLayoutTexts } from "./confirmationLayoutTexts";

export * from "./confirmationDescriptionTexts";
export * from "./confirmationActionsTexts";
export * from "./confirmationModalTexts";
export * from "./confirmationLayoutTexts";

/**
 * Text copy for the service confirmation modal and fallback page.
 */
export const confirmationTexts = {
    badgeHeading: ConfirmationDescriptionTexts.badgeHeading,
    continueBtn: ConfirmationActionsTexts.continueBtn,
    cancelBtn: ConfirmationActionsTexts.cancelBtn,
    noService: ConfirmationLayoutTexts.noService,
} as const;
