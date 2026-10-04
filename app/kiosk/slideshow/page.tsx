/**
 * @fileoverview Full-screen kiosk welcome screen displayed after inactivity.
 *
 * Shows the facility image without additional copy. Touching or clicking the
 * screen returns the kiosk to patient-type selection.
 */

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KIOSK_ROUTES,
  KIOSK_TIMING,
} from "@/app/kiosk/constants/kioskNavigation";
import {
  IDLE_SLIDESHOW_IMAGES,
  IdleSlideshowClasses,
} from "@/app/kiosk/constants/idleRedirect";
import { IdleRedirectTexts } from "@/app/kiosk/constants/idleRedirectTexts";

/**
 * Renders the idle welcome image and a full-screen activation target.
 *
 * @returns The full-viewport welcome screen.
 */
export default function IdleSlideshowPage() {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (IDLE_SLIDESHOW_IMAGES.length < 2) return;

    const intervalId = window.setInterval(() => {
      setActiveImageIndex(
        (currentIndex) => (currentIndex + 1) % IDLE_SLIDESHOW_IMAGES.length,
      );
    }, KIOSK_TIMING.SLIDESHOW_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className={IdleSlideshowClasses.screen}>
      <button
        type="button"
        className={IdleSlideshowClasses.activate}
        aria-label={IdleRedirectTexts.activateSlideshow}
        onClick={() => router.push(KIOSK_ROUTES.NEW_OLD_SELECTION)}
      >
        <Image
          src={IDLE_SLIDESHOW_IMAGES[activeImageIndex]}
          alt=""
          fill
          priority
          sizes="100vw"
          className={IdleSlideshowClasses.image}
        />
      </button>
    </div>
  );
}
