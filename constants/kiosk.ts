import type { CSSProperties } from "react";

/**
 * Global header font sizes in px.
 * Plain numbers so they can be used directly in inline `style` objects
 * (React appends "px" to numeric values for properties like `fontSize`).
 */
export const fontSizeHeader = {
  Header1: 40,
  Header2: 30,
  Header3: 24,
} as const;

/**
 * Global body / label font sizes in px.
 *
 * Used across kiosk screens for subtitle, secondary, and fine-print text
 * so every page shares a single typographic scale.
 */
export const fontSizeBody = {
  /** Primary subtitle / instruction text (e.g. category sub-labels). */
  Body1: 26,
  /** Secondary text (e.g. bilingual instruction line). */
  Body2: 20,
  /** Small labels (e.g. English translations below Filipino headings). */
  Body3: 18,
  /** Fine text (e.g. supplementary info). */
  Body4: 16,
} as const;

