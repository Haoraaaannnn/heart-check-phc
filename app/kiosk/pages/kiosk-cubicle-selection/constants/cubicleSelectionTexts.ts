/**
 * @file cubicleSelectionTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for cubicle selection.
 */

import { CubicleHeaderTexts } from "./cubicleHeaderTexts";

export * from "./cubicleHeaderTexts";

/**
 * Composite text copy dictionary for cubicle selection.
 */
export const cubicleSelectionTexts = {
    ...CubicleHeaderTexts,
} as const;
