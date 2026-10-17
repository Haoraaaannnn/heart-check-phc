/**
 * @file categorySelectionTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for category selection.
 */

import { CategoryHeaderTexts } from "@/app/kiosk/pages/category-selection/constants/categoryHeaderTexts";
import { CategoryCardsTexts } from "@/app/kiosk/pages/category-selection/constants/categoryCardsTexts";

export * from "@/app/kiosk/pages/category-selection/constants/categoryHeaderTexts";
export * from "@/app/kiosk/pages/category-selection/constants/categoryCardsTexts";

/**
 * Composite text copy dictionary for the unified age category selection screen.
 * Maintained for backwards compatibility.
 */
export const categorySelectionTexts = {
    ...CategoryHeaderTexts,
    ...CategoryCardsTexts,
} as const;
