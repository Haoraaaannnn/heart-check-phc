// app/kiosk/layout.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import KioskHeader from "@/app/kiosk/pages/kiosk-services/components/KioskHeader";
import KioskBackButton from "@/components/reusables/KioskBackButton";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
    KioskLoadingProvider,
    useKioskLoading,
} from "@/app/kiosk/context/KioskLoadingContext";
import KioskLoadingOverlay from "@/app/kiosk/components/KioskLoadingOverlay";

/** Props for {@link MainKioskLayout}. */
interface MainKioskLayoutProps {
    /** The current kiosk page (or nested kiosk layout). */
    children: React.ReactNode;
}

/**
 * Shows the kiosk loading overlay the instant an in-app navigation link is
 * clicked, and hides it once the destination page has actually mounted
 * (detected via the `pathname` change).
 *
 * @remarks
 * This exists because `usePathname()` only updates *after* Next.js has
 * fetched and rendered the destination route. On a slow connection (e.g.
 * 3G), that fetch can take a noticeable moment — listening for the click
 * itself (capture phase, so it runs before Next.js's own click handling)
 * closes that gap: the overlay appears the instant the tap happens.
 *
 * Only intercepts clicks on same-tab, same-origin `<a>` elements (i.e.
 * `next/link`-rendered anchors) — modified clicks (ctrl/cmd/middle-click)
 * and external/`target="_blank"` links are left alone.
 *
 * Imperative navigation via `router.push()` (e.g. through
 * `useKioskNavigate`) calls `showLoading()` on its own and isn't caught by
 * this click listener — but that's fine, because the hide-on-pathname-
 * change effect below doesn't track *how* the overlay was shown, only
 * whether the path actually changed while it's up. Every navigation,
 * however it's triggered, ends the same way: pathname changes → overlay
 * hides. (An earlier version gated the hide behind a ref set only by this
 * click listener, which meant overlays shown via `useKioskNavigate` never
 * got hidden — fixed by removing that gate.)
 *
 * Must be rendered inside {@link KioskLoadingProvider}.
 */
function KioskRouteChangeIndicator({ pathname }: { pathname: string }) {
    const { showLoading, hideLoading } = useKioskLoading();
    const previousPathname = useRef(pathname);

    // Show the overlay immediately on click, before Next.js starts fetching.
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            const target = event.target as HTMLElement;
            const anchor = target.closest("a");
            if (!anchor) return;

            const isModifiedClick =
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey;
            const isExternal =
                anchor.target === "_blank" || anchor.hasAttribute("download");
            const isSameOrigin =
                anchor.origin === window.location.origin;

            if (isModifiedClick || isExternal || !isSameOrigin) return;
            // Clicking the current page's own link (e.g. a logo) — no
            // navigation will actually happen, so don't show the overlay.
            if (anchor.pathname === pathname) return;

            showLoading();
        }

        // Capture phase so this runs before Next.js's own Link click handler.
        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [pathname, showLoading]);

    // Hide the overlay once the path has actually changed — regardless of
    // whether the navigation was started by the click listener above or by
    // an imperative router.push() (e.g. via useKioskNavigate).
    useEffect(() => {
        if (previousPathname.current === pathname) return;
        previousPathname.current = pathname;
        hideLoading();
    }, [pathname, hideLoading]);

    return null;
}

/**
 * Root layout for every `/kiosk/*` route.
 *
 * Provides the full-screen shell shared by all kiosk pages: an optional back
 * button, the main content area, the bottom footer (`KioskHeader`), and a
 * kiosk-wide loading overlay (auto-shown on link clicks and imperative
 * navigations, and manually triggerable from any page via
 * `useKioskLoading()` for non-navigation async work).
 *
 * @remarks
 * Back button rules:
 * - Only shown on `/kiosk/pages/kiosk-services`, `/kiosk/pages/kiosk-cubicle-selection`,
 *   and `/kiosk/pages/category-selection`.
 * - The `type` (patient type) and `serviceId` query params are preserved when
 *   going backward, so the patient doesn't lose their earlier choices.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The kiosk shell wrapping the current page.
 */
export default function MainKioskLayout({ children }: MainKioskLayoutProps) {
    // False on the server and first paint, true after hydration (drives the fade-in).
    const mounted = useIsMounted();

    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Selected patient type ("new" | "old") from the URL, if present.
    const patientType = searchParams.get("type");

    const shouldShowBackButton =
        pathname === "/kiosk/pages/kiosk-services" ||
        pathname === "/kiosk/pages/kiosk-cubicle-selection" ||
        pathname === "/kiosk/pages/category-selection";

    // Where the back button goes; undefined means no back target on this page.
    let backHref: string | undefined = undefined;

    if (pathname === "/kiosk/pages/kiosk-services") {
        backHref = "/kiosk/pages/kiosk-new-old-selection";
    }

    if (pathname === "/kiosk/pages/kiosk-cubicle-selection") {
        backHref = patientType
            ? `/kiosk/pages/kiosk-services?type=${encodeURIComponent(patientType)}`
            : "/kiosk/pages/kiosk-services";
    }

    if (pathname === "/kiosk/pages/category-selection") {
        const serviceId = searchParams.get("serviceId");
        const params = new URLSearchParams();
        if (patientType) params.set("type", patientType);
        if (serviceId) params.set("serviceId", serviceId);
        const query = params.toString();
        backHref = `/kiosk/pages/kiosk-services${query ? `?${query}` : ""}`;
    }

    return (
        <KioskLoadingProvider>
            <KioskRouteChangeIndicator pathname={pathname} />

            <div
                className={`fixed inset-0 flex h-dvh w-dvw flex-col overflow-hidden bg-white transition-opacity duration-300 ${
                    mounted ? "opacity-100" : "opacity-0"
                }`}
            >
                {shouldShowBackButton && backHref && (
                    <KioskBackButton href={backHref} />
                )}

                {/* Main content: fills all remaining space, no fixed dimensions. */}
                <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                    {children}
                </main>

                {/* Footer: sized by its own content. */}
                <div className="w-full flex-shrink-0">
                    <KioskHeader />
                </div>
            </div>

            <KioskLoadingOverlay />
        </KioskLoadingProvider>
    );
}