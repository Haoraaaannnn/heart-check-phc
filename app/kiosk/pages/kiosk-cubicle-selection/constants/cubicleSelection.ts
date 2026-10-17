/**
 * @file cubicleSelection.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for cubicle selection.
 */

export * from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeader";
export * from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard";
export * from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout";
export * from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleSelectionTexts";

import { CubicleCardClasses } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard";
import { CubicleLayoutClasses } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout";

/**
 * Composite class dictionary combining cubicle selection utility classes for backward compatibility.
 */
export const CubicleSelectionClasses = {
    ...CubicleCardClasses,
    ...CubicleLayoutClasses,
} as const;
