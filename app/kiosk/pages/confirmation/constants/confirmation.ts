/**
 * @file confirmation.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for the confirmation feature.
 */

export * from "./confirmationBanner";
export * from "./confirmationDescription";
export * from "./confirmationActions";
export * from "./confirmationModal";
export * from "./confirmationLayout";
export * from "./confirmationTexts";

import { ConfirmationBannerStyle, ConfirmationBannerClasses } from "./confirmationBanner";
import { ConfirmationDescriptionStyle } from "./confirmationDescription";
import { ConfirmationActionsStyle, ConfirmationActionsClasses } from "./confirmationActions";
import { ConfirmationModalStyle, ConfirmationModalClasses } from "./confirmationModal";
import { ConfirmationLayoutStyle, ConfirmationLayoutClasses } from "./confirmationLayout";

/**
 * Composite class dictionary combining confirmation utility classes for backward compatibility.
 */
export const ConfirmationClasses = {
    ...ConfirmationBannerClasses,
    ...ConfirmationActionsClasses,
    ...ConfirmationModalClasses,
    ...ConfirmationLayoutClasses,
} as const;
