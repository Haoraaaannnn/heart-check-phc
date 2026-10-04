/**
 * @fileoverview Applies the kiosk inactivity redirect to patient-flow routes.
 *
 * The wrapper is mounted by the kiosk root layout and watches interaction on
 * `/kiosk/pages/*`. After the idle limit, it sends the kiosk to its slideshow
 * welcome screen. The slideshow route itself is intentionally excluded.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  KIOSK_ROUTES,
  KIOSK_TIMING,
} from "@/app/kiosk/constants/kioskNavigation";

/** Browser events that indicate activity during the kiosk patient flow. */
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "touchstart",
  "keydown",
] as const;

/** Props for {@link IdleRedirectWrapper}. */
interface IdleRedirectWrapperProps {
  /** The kiosk layout and active route content. */
  children: React.ReactNode;
}

/**
 * Returns kiosk patient-flow pages to the welcome slideshow after inactivity.
 *
 * @param props - The wrapped kiosk layout content.
 * @returns The unchanged children; side effects are limited to the idle timer.
 */
export default function IdleRedirectWrapper({
  children,
}: IdleRedirectWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pathname.startsWith("/kiosk/pages/")) return;

    const resetTimer = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.push(KIOSK_ROUTES.SLIDESHOW);
      }, KIOSK_TIMING.IDLE_REDIRECT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, resetTimer, { passive: true }),
    );

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, resetTimer),
      );
    };
  }, [pathname, router]);

  return <>{children}</>;
}
