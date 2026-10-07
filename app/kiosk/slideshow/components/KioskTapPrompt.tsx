/**
 * @fileoverview Floating visual "Tap to Start" identifier for the kiosk idle slideshow.
 * @module app/kiosk/slideshow/components/KioskTapPrompt
 * @remarks Displays an elevated, accessible call-to-action pill guiding patients to begin interaction.
 */
"use client";

import {
  IdleRedirectClasses,
  IdleRedirectStyle,
} from "@/app/kiosk/constants/idleRedirect";
import { IdleRedirectTexts } from "@/app/kiosk/constants/idleRedirectTexts";

/**
 * Floating "Tap to Start" badge displayed over the idle slideshow.
 *
 * @remarks
 * Uses pointer-events-none on its outer container so touches pass cleanly to the
 * underlying full-screen slideshow button while clearly indicating touch interaction is available.
 *
 * @returns The tactile "Tap to Start" callout badge.
 */
export default function KioskTapPrompt() {
  return (
    <div style={IdleRedirectStyle.tapPromptContainer}>
      <div
        className={IdleRedirectClasses.tapPromptBadge}
        style={IdleRedirectStyle.tapPromptBadge}
      >
        <div style={IdleRedirectStyle.tapIconContainer}>
          <i
            className={IdleRedirectClasses.tapIcon}
            style={IdleRedirectStyle.tapIcon}
            aria-hidden="true"
          />
        </div>
        <div style={IdleRedirectStyle.tapTextColumn}>
          <span style={IdleRedirectStyle.tapTitle}>
            {IdleRedirectTexts.tapToStartTitle}
          </span>
          <span style={IdleRedirectStyle.tapSubtitle}>
            {IdleRedirectTexts.tapToStartSubtitle}
          </span>
        </div>
      </div>
    </div>
  );
}
