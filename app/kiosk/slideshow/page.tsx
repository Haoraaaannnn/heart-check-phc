/**
 * @fileoverview Full-screen idle destination for the kiosk patient flow.
 * @module app/kiosk/slideshow/page
 * @remarks Uses the existing public slideshow images and kiosk-owned route, timing, style, and text constants.
 */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KioskHeader from "@/app/kiosk/pages/kiosk-services/components/KioskHeader";
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

/**
 * Full-screen idle screen that cycles through the kiosk's existing images.
 *
 * @remarks
 * Activating the screen returns the kiosk to the patient-type selection
 * route. Image order and timing are controlled by kiosk constants.
 *
 * @returns The full-screen, accessible idle slideshow.
 */
export default function KioskIdleSlideshowPage() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

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
        onClick={() => router.replace(KIOSK_ROUTES.NEW_OLD_SELECTION)}
      >
        {IDLE_SLIDESHOW_IMAGES.map((imagePath, index) => (
          <Image
            key={imagePath}
            src={imagePath}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            className={IdleRedirectClasses.image(index === activeSlide)}
          />
        ))}
      </button>
      <div style={IdleRedirectStyle.footerOverlay}>
        <KioskHeader />
      </div>
    </>
  );
}
