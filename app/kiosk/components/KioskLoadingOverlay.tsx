// app/kiosk/components/KioskLoadingOverlay.tsx
"use client";

import { useKioskLoading } from "@/app/kiosk/context/KioskLoadingContext";
import {
    KioskLoadingOverlayClasses,
    KioskLoadingOverlayStyles,
} from "@/app/kiosk/constants/kioskLoadingOverlay";
import { KioskLoadingOverlayTexts } from "@/app/kiosk/constants/kioskLoadingOverlayTexts";

/**
 * KioskLoadingOverlay
 * -----------------------------------------------------------------------
 * Full-screen modal-style loading indicator for the kiosk flow. Reads its
 * visibility from {@link useKioskLoading} rather than a prop, so it can be
 * rendered once in `app/kiosk/layout.tsx` and controlled from anywhere in
 * the kiosk route tree via `showLoading()` / `hideLoading()`.
 *
 * The backdrop is blurred (not fully opaque) so the page behind stays
 * visible but reads as inert while the overlay is up.
 *
 * @returns The rendered full-screen loading overlay, or null when inactive.
 */
export default function KioskLoadingOverlay() {
    const { isLoading, message } = useKioskLoading();

    if (!isLoading) return null;

    return (
        <div
            role={KioskLoadingOverlayTexts.ariaRole}
            aria-live={KioskLoadingOverlayTexts.ariaLive}
            aria-label={message}
            className={KioskLoadingOverlayClasses.overlay}
            style={KioskLoadingOverlayStyles.overlay}
        >
            <div
                className={KioskLoadingOverlayClasses.spinner}
                style={KioskLoadingOverlayStyles.spinner}
                aria-hidden="true"
            />
            <p
                className={KioskLoadingOverlayClasses.message}
                style={KioskLoadingOverlayStyles.message}
            >
                {message}
            </p>
        </div>
    );
}