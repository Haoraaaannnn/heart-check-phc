// app/kiosk/components/KioskLoadingOverlay.tsx
"use client";

import { useKioskLoading } from "@/app/kiosk/context/KioskLoadingContext";

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
 */
export default function KioskLoadingOverlay() {
    const { isLoading, message } = useKioskLoading();

    if (!isLoading) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={message}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-sm"
        >
            <div
                className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
                aria-hidden="true"
            />
            <p className="text-lg font-medium text-gray-700 drop-shadow-sm">
                {message}
            </p>
        </div>
    );
}