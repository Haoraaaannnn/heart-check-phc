/**
 * @file cubicleSelectionTexts.ts
 * @description Centralized barrel re-exporting component-scoped text constants for cubicle selection.
 */

import { CubicleHeaderTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeaderTexts";
import { CubicleCardTexts } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCardTexts";

export * from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeaderTexts";
export * from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCardTexts";

/**
 * Composite text copy dictionary for cubicle selection.
 */
export const cubicleSelectionTexts = {
    ...CubicleHeaderTexts,
    ...CubicleCardTexts,
} as const;
