/**
 * @fileoverview Full-screen idle destination for the kiosk patient flow.
 * @module app/kiosk/slideshow/page
 * @remarks Displays instructional guide slides and handles instant touch/keyboard activation back to check-in.
 */
"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IDLE_SLIDESHOW_IMAGES,
  IdleRedirectClasses,
  IdleRedirectStyle,
} from "@/app/kiosk/constants/idleRedirect";
import { IdleRedirectTexts } from "@/app/kiosk/constants/idleRedirectTexts";
import {
  KIOSK_ROUTES,
  KIOSK_TIMING,
} from "@/app/kiosk/constants/kioskNavigation";
import KioskTapPrompt from "@/app/kiosk/slideshow/components/KioskTapPrompt";

/**
 * Full-screen idle screen that cycles through instructional guide slides.
 *
 * @remarks
 * Activating the screen returns the kiosk to the patient-type selection
 * route. Route prefetching ensures immediate transition on touch. All
 * instruction images are preloaded with high priority for seamless cross-fading.
 *
 * @returns The full-screen, accessible idle slideshow.
 */
export default function KioskIdleSlideshowPage() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  const handleActivate = useCallback(() => {
    router.replace(KIOSK_ROUTES.NEW_OLD_SELECTION);
  }, [router]);

  useEffect(() => {
    // Prefetch destination so check-in begins instantly without network delay.
    router.prefetch(KIOSK_ROUTES.NEW_OLD_SELECTION);
  }, [router]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide(
        (currentSlide) => (currentSlide + 1) % IDLE_SLIDESHOW_IMAGES.length,
      );
    }, KIOSK_TIMING.SLIDESHOW_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={IdleRedirectTexts.activateKiosk}
        className="fixed inset-0 z-[100] block h-dvh w-dvw overflow-hidden"
        style={IdleRedirectStyle.slideshowButton}
        onClick={handleActivate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
            handleActivate();
          }
        }}
      >
        {IDLE_SLIDESHOW_IMAGES.map((imagePath, index) => (
          <Image
            key={imagePath}
            src={imagePath}
            alt=""
            fill
            sizes="100vw"
            priority
            quality={90}
            draggable={false}
            className={IdleRedirectClasses.image(index === activeSlide)}
          />
        ))}
      </button>

      <KioskTapPrompt />
    </>
  );
}
