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

/** Global body font sizes in px. Empty until body text tokens are needed. */
export const fontSizeBody = {

} as const;
