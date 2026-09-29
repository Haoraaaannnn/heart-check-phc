/**
 * Inactivity redirect logic for kiosk screens.
 *
 * The kiosk is treated as a self-serve flow that should automatically return to
 * the slideshow after a period of inactivity. This wrapper listens for common
 * user activity events, resets the inactivity timer on each event, and pushes
 * the user back to `/kiosk/slideshow` when the configured timeout is reached.
 *
 * This component is intentionally minimal: it is a client-side wrapper around
 * the kiosk content and does not modify the rendered UI beyond the existing
 * children it returns.
 */
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const IDLE_TIMEOUT = 25 * 1000;
const RETURN_PATH = "/kiosk/slideshow";

/**
 * Redirects the kiosk patient-flow screens back to the start of the flow after
 * a period of inactivity.
 *
 * @param props - The kiosk page content to wrap.
 * @returns A wrapper element that keeps the kiosk content mounted while
 * monitoring for user activity.
 */
export default function IdleRedirectWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const isIdleTarget = pathname.startsWith("/kiosk/pages/");

    if (!isIdleTarget) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const startTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        router.push(RETURN_PATH);
      }, IDLE_TIMEOUT);
    };

    const resetHandler = () => startTimer();

    startTimer();

    window.addEventListener("mousemove", resetHandler);
    window.addEventListener("mousedown", resetHandler);
    window.addEventListener("touchstart", resetHandler);
    window.addEventListener("keydown", resetHandler);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      window.removeEventListener("mousemove", resetHandler);
      window.removeEventListener("mousedown", resetHandler);
      window.removeEventListener("touchstart", resetHandler);
      window.removeEventListener("keydown", resetHandler);
    };
  }, [pathname, router]);

  return <div>{children}</div>;
}
