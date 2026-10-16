/**
 * @file cubicleSelectionTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for cubicle selection.
 */

import { CubicleHeaderTexts } from "./cubicleHeaderTexts";
import { CubicleCardTexts } from "./cubicleCardTexts";

export * from "./cubicleHeaderTexts";
export * from "./cubicleCardTexts";

/**
 * Composite text copy dictionary for cubicle selection.
 */
export const cubicleSelectionTexts = {
    ...CubicleHeaderTexts,
    ...CubicleCardTexts,
} as const;
