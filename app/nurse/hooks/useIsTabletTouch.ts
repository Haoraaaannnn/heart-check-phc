/**
 * @fileoverview Hook for detecting touch-enabled tablet devices in the Nurse Dashboard.
 *
 * Implements client-side capability checking using pointer media queries and touch event
 * detection via `useSyncExternalStore` for SSR safety and zero hydration mismatches.
 *
 * Adheres strictly to AGENTS.md guidelines with full JSDoc and zero emojis.
 *
 * @module app/nurse/hooks/useIsTabletTouch
 */

'use client';

import { useSyncExternalStore } from 'react';

/**
 * Registers window resize, orientation, and pointer media query change listeners.
 *
 * @param onChange - Callback provided by React when store snapshot changes.
 * @returns Cleanup function to unsubscribe event listeners.
 */
function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);

  let coarseMedia: MediaQueryList | null = null;
  try {
    coarseMedia = window.matchMedia('(pointer: coarse)');
    if (coarseMedia?.addEventListener) {
      coarseMedia.addEventListener('change', onChange);
    }
  } catch {
    // Ignore environments where matchMedia is not supported
  }

  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    if (coarseMedia?.removeEventListener) {
      coarseMedia.removeEventListener('change', onChange);
    }
  };
}

/**
 * Reads client-side touch and tablet capability snapshot.
 *
 * Evaluates:
 * 1. Primary coarse pointer (touch / stylus): `(pointer: coarse)`.
 * 2. Touch points availability: `navigator.maxTouchPoints > 0`.
 * 3. Touch event registration: `'ontouchstart' in window`.
 *
 * @returns `true` when operating on a touch-enabled tablet device.
 */
function getSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hasTouchPoints =
    typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0;
  const hasTouchEvents = 'ontouchstart' in window;
  const hasCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  return hasTouchPoints || hasTouchEvents || hasCoarsePointer;
}

/**
 * Server-safe snapshot fallback.
 *
 * Assumes false during SSR to avoid hydration discrepancies.
 *
 * @returns `false`.
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Custom React hook detecting whether current client is a touch-enabled tablet device.
 *
 * @remarks
 * Used in the Nurse Dashboard to selectively activate the side navigation rail on tablet
 * touchscreens while maximizing full-width clinical pipeline display on desktop workstations.
 *
 * @returns `true` if device is touch-enabled tablet; otherwise `false`.
 */
export function useIsTabletTouch(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useIsTabletTouch;
