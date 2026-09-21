"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export default function IdleRedirectWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const startTimer = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        router.push(`/kiosk/slideshow`);
      }, IDLE_TIMEOUT);
    };

    const resetHandler = () => startTimer();

    startTimer();

    window.addEventListener("mousemove", resetHandler);
    window.addEventListener("touchstart", resetHandler);
    window.addEventListener("keydown", resetHandler);
    window.addEventListener("click", resetHandler);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", resetHandler);
      window.removeEventListener("touchstart", resetHandler);
      window.removeEventListener("keydown", resetHandler);
      window.removeEventListener("click", resetHandler);
    };
  }, [router]);

  return <div>{children}</div>;
}
