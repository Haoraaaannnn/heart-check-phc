/**
 * @fileoverview Kiosk-only inactivity detection for patient-flow routes.
 * @module app/kiosk/components/IdleRedirectWrapper
 * @remarks Depends on Next.js pathname/router hooks and kiosk route/timing constants.
 */
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  KIOSK_ROUTES,
  KIOSK_TIMING,
} from "@/app/kiosk/constants/kioskNavigation";

/**
 * Watches kiosk patient-flow activity and returns inactive sessions to the
 * idle slideshow.
 *
 * @remarks
 * The timer is scoped to `/kiosk/pages/*`; the slideshow itself remains
 * available until the patient activates it. Activity from pointer, touch,
 * and keyboard input restarts the full inactivity period.
 *
 * @returns `null`; this component only manages the inactivity side effect.
 */
export default function IdleRedirectWrapper() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith("/kiosk/pages/")) return;

    let timeoutId: number;

    function resetTimeout() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        router.replace(KIOSK_ROUTES.SLIDESHOW);
      }, KIOSK_TIMING.IDLE_REDIRECT_MS);
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
    ];

    resetTimeout();
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, resetTimeout, { passive: true }),
    );

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, resetTimeout),
      );
    };
  }, [pathname, router]);

  return null;
}
