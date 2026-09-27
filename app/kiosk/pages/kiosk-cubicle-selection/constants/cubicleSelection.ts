/**
 * @file cubicleSelection.ts
 * @description Centralized barrel exporting style objects and class name dictionaries for cubicle selection.
 */

export * from "./cubicleHeader";
export * from "./cubicleCard";
export * from "./cubicleLayout";
export * from "./cubicleSelectionTexts";

import { CubicleCardClasses } from "./cubicleCard";
import { CubicleLayoutClasses } from "./cubicleLayout";

/**
 * Composite class dictionary combining cubicle selection utility classes for backward compatibility.
 */
export const CubicleSelectionClasses = {
    ...CubicleCardClasses,
    ...CubicleLayoutClasses,
} as const;
