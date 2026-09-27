/**
 * @file categorySelectionTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for category selection.
 */

import { CategoryHeaderTexts } from "./categoryHeaderTexts";
import { CategoryCardsTexts } from "./categoryCardsTexts";

export * from "./categoryHeaderTexts";
export * from "./categoryCardsTexts";

/**
 * Composite text copy dictionary for the unified age category selection screen.
 * Maintained for backwards compatibility.
 */
export const categorySelectionTexts = {
    ...CategoryHeaderTexts,
    ...CategoryCardsTexts,
} as const;
