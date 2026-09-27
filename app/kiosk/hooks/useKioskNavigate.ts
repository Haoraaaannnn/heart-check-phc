// app/kiosk/hooks/useKioskNavigate.ts
"use client";

import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useKioskLoading } from "@/app/kiosk/context/KioskLoadingContext";

/**
 * Drop-in replacement for `router.push()` on kiosk pages.
 *
 * Shows the kiosk-wide loading overlay immediately, then navigates.
 *
 * @remarks
 * Next.js's App Router wraps `router.push()` navigations in a React
 * transition internally. If `showLoading()`'s state update and the
 * `router.push()` call happen in the same synchronous handler, React can
 * batch them into the same render pass — and if that pass suspends on the
 * destination route's data fetch, the *whole* commit (including the
 * overlay's "show" update) gets held back until the navigation is ready.
 * The visible symptom is a blank pause, then the overlay "blinking" in
 * right as the new page is about to appear, instead of showing instantly.
 *
 * `flushSync` forces the `showLoading()` update to commit and paint
 * synchronously, before `router.push()` runs — so the overlay is
 * guaranteed to be on screen before the transition (and its potential
 * suspense) begins.
 *
 * The overlay is hidden automatically once the destination page mounts
 * (see `KioskRouteChangeIndicator` in `app/kiosk/layout.tsx`) — callers
 * never need to call `hideLoading()` themselves.
 *
 * @example
 * ```tsx
 * const navigate = useKioskNavigate();
 * // ...
 * <button onClick={() => navigate(`/kiosk/pages/kiosk-services?type=${type}`)}>
 * ```
 *
 * @returns A function with the same signature as `router.push()`.
 */
export function useKioskNavigate() {
    const router = useRouter();
    const { showLoading } = useKioskLoading();

    return (href: string) => {
        flushSync(() => {
            showLoading();
        });
        router.push(href);
    };
}