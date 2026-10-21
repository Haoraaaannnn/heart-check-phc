/**
 * @fileoverview Circular screen ripple view transition orchestrator for dark/light mode switching.
 *
 * Implements a high-performance circular clip-path wave originating from the user's
 * exact click/touch coordinates and expanding across the entire viewport to seamlessly
 * reveal the new theme via the native View Transitions API.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full symbol and module level JSDocs (Rule 1).
 * - Zero Emojis Standard: Clean plain-text formatting (Rule 6).
 *
 * @module lib/theme/themeTransition
 */

import { MouseEvent } from "react";
import { flushSync } from "react-dom";

/**
 * Extended Document interface declaring the View Transitions API signature.
 */
interface DocumentWithViewTransition extends Document {
  startViewTransition?: (callback: () => Promise<void> | void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
}

/**
 * Executes a smooth circular ripple screen transition when switching themes.
 *
 * Originates a radial wipe from the click coordinates (or element center if triggered via keyboard),
 * expanding across the furthest corner of the viewport to reveal the target theme.
 *
 * @param event - Mouse or touch click event providing origin coordinates.
 * @param toggleFn - State update callback that applies the new theme (e.g. setTheme).
 */
export function toggleThemeWithRipple(
  event: MouseEvent<HTMLElement>,
  toggleFn: () => void
): void {
  const doc = document as DocumentWithViewTransition;

  // Fallback immediately if browser doesn't support View Transitions or prefers reduced motion
  if (
    typeof document === "undefined" ||
    !doc.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    toggleFn();
    return;
  }

  // Calculate origin coordinates from click or element bounding rect center for keyboard events
  let x = event.clientX;
  let y = event.clientY;

  if (x === 0 && y === 0 && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  // Calculate distance from origin to the furthest viewport corner
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = doc.startViewTransition(() => {
    flushSync(() => {
      toggleFn();
    });
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 450,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
}
