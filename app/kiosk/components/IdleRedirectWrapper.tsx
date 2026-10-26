/**
 * @fileoverview Kiosk-only inactivity detection and countdown warning modal controller for patient-flow routes.
 *
 * Monitors patient physical touch, pointer, and keyboard interactions across kiosk routes. When idle
 * for 45 seconds, sounds an audible hospital chime and displays an accessible countdown modal
 * ("Are You Still There?"). If the countdown completes without interaction, cleanses in-memory
 * session parameters and resets to the idle slideshow. Tapping "Continue Session" dismisses
 * the modal and resets the inactivity timer without losing entered state.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full symbol and module level JSDocs (Rule 1).
 * - Separation of Concerns: Text copy from `inactivityModalTexts.ts`, styling from `inactivityModalStyles.ts` (Rule 2).
 * - Kiosk UI Centering Standard: Modal dialog centered with high-contrast solid surfaces (Rules 9, 10).
 * - Zero Emojis Standard: Replaced with Boxicons and clean text (Rule 6).
 * - Non-Truncated Clinical Data: Plain text without truncation (Rule 11).
 *
 * @module app/kiosk/components/IdleRedirectWrapper
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  KIOSK_ROUTES,
  KIOSK_TIMING,
} from "@/app/kiosk/constants/kioskNavigation";
import InactivityTimeoutModal from "@/app/kiosk/components/InactivityTimeoutModal";
import { playInactivityChime } from "@/app/kiosk/lib/kioskChime";

/**
 * Watches kiosk patient-flow activity, presents the "Are You Still There?" countdown modal,
 * and safely resets inactive sessions to the idle slideshow.
 *
 * @remarks
 * Scoped to `/kiosk/pages/*` patient-intake routes.
 * - Entrance route (`/kiosk/pages/kiosk-new-old-selection`): Silently returns to `/kiosk/slideshow` after 45s idle without showing the warning modal or countdown timer.
 * - Active check-in routes (`kiosk-services`, `category-selection`, `kiosk-cubicle-selection`, `sms-input`): 45s idle sounds acoustic chime and opens 15s countdown warning modal ("Are You Still There?").
 * - Tapping "Magsimula Muli" ("Start Over") clears session storage and redirects to `/kiosk/pages/kiosk-new-old-selection`.
 * - Tapping "Magpatuloy" ("Continue Session") preserves entered data and dismisses the modal.
 * - Unacknowledged countdown expiration clears session storage and resets to `/kiosk/slideshow`.
 * - Excludes `/kiosk/pages/queue-print` (which maintains its own ticket viewing auto-close countdown).
 *
 * @returns The countdown modal component or null when inactive.
 */
export default function IdleRedirectWrapper() {
  const pathname = usePathname();
  const router = useRouter();

  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    KIOSK_TIMING.COUNTDOWN_GRACE_SECONDS
  );

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarningOpenRef = useRef<boolean>(false);

  // Synchronize ref with active modal state to prevent stale closure in event listeners
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  /**
   * Resets session parameters and redirects to entrance patient type selection screen.
   * Invoked when the patient actively taps "Magsimula Muli" (Start Over).
   */
  const handleStartOver = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setIsWarningOpen(false);

    // Safely clear client session storage to avoid data leakage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch {
        // Silently catch restricted storage access
      }
    }

    router.replace(KIOSK_ROUTES.NEW_OLD_SELECTION);
  }, [router]);

  /**
   * Cleanses session parameters and safely redirects to the idle slideshow.
   * Invoked when the 15-second countdown grace period expires without patient interaction.
   */
  const handleInactivityTimeout = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setIsWarningOpen(false);

    // Safely clear client session storage to avoid data leakage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch {
        // Silently catch restricted storage access
      }
    }

    router.replace(KIOSK_ROUTES.SLIDESHOW);
  }, [router]);

  /**
   * Activates the warning modal, plays the acoustic chime, and initiates the 15-second countdown.
   */
  const triggerInactivityWarning = useCallback(() => {
    setIsWarningOpen(true);
    setRemainingSeconds(KIOSK_TIMING.COUNTDOWN_GRACE_SECONDS);

    // Play pleasant hospital warning chime
    playInactivityChime();

    // Start 1-second ticking countdown
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          handleInactivityTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleInactivityTimeout]);

  /**
   * Dismisses the warning modal, clears the countdown interval, and restarts the 45-second timer.
   */
  const handleContinueSession = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setIsWarningOpen(false);
    setRemainingSeconds(KIOSK_TIMING.COUNTDOWN_GRACE_SECONDS);

    // Schedule next 45-second inactivity warning
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      triggerInactivityWarning();
    }, KIOSK_TIMING.INACTIVITY_WARNING_MS);
  }, [triggerInactivityWarning]);


  useEffect(() => {
    // Non-patient-flow routes and ticket viewing: skip idle watching
    if (
      !pathname.startsWith("/kiosk/pages/") ||
      pathname === KIOSK_ROUTES.QUEUE_PRINT
    ) {
      setIsWarningOpen(false);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    // 1. Entrance screen (kiosk-new-old-selection): Silent direct redirect to slideshow (no warning modal/timer)
    if (pathname === KIOSK_ROUTES.NEW_OLD_SELECTION) {
      setIsWarningOpen(false);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      let lastActivityTime = Date.now();
      function returnToSlideshowOnIdle() {
        const now = Date.now();
        if (now - lastActivityTime < 500) return;
        lastActivityTime = now;

        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        warningTimerRef.current = setTimeout(() => {
          router.replace(KIOSK_ROUTES.SLIDESHOW);
        }, KIOSK_TIMING.INACTIVITY_WARNING_MS);
      }

      const activityEvents: Array<keyof WindowEventMap> = [
        "pointerdown",
        "touchstart",
        "keydown",
      ];

      warningTimerRef.current = setTimeout(() => {
        router.replace(KIOSK_ROUTES.SLIDESHOW);
      }, KIOSK_TIMING.INACTIVITY_WARNING_MS);

      activityEvents.forEach((eventName) =>
        window.addEventListener(eventName, returnToSlideshowOnIdle, { passive: true })
      );

      return () => {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        activityEvents.forEach((eventName) =>
          window.removeEventListener(eventName, returnToSlideshowOnIdle)
        );
      };
    }

    // 2. Active patient-flow screens (services, categories, cubicles, sms-input): Watcher with warning modal
    let lastActivityTime = Date.now();
    function resetInactivityTimer() {
      // While warning modal is active, require deliberate button tap to dismiss
      if (isWarningOpenRef.current) return;

      const now = Date.now();
      if (now - lastActivityTime < 500) return;
      lastActivityTime = now;

      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        triggerInactivityWarning();
      }, KIOSK_TIMING.INACTIVITY_WARNING_MS);
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "keydown",
    ];

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      triggerInactivityWarning();
    }, KIOSK_TIMING.INACTIVITY_WARNING_MS);

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetInactivityTimer, { passive: true })
    );

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetInactivityTimer)
      );
    };
  }, [pathname, router, triggerInactivityWarning]);

  return (
    <InactivityTimeoutModal
      isOpen={isWarningOpen}
      remainingSeconds={remainingSeconds}
      totalSeconds={KIOSK_TIMING.COUNTDOWN_GRACE_SECONDS}
      onContinue={handleContinueSession}
      onReset={handleStartOver}
    />
  );
}
