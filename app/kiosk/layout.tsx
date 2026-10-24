// app/kiosk/layout.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import KioskHeader from "@/app/kiosk/pages/kiosk-services/components/KioskHeader";
import KioskBackButton from "@/components/reusables/KioskBackButton";
import KioskStepProgress from "@/app/kiosk/components/KioskStepProgress";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
  KioskLoadingProvider,
  useKioskLoading,
} from "@/app/kiosk/context/KioskLoadingContext";
import KioskLoadingOverlay from "@/app/kiosk/components/KioskLoadingOverlay";
import IdleRedirectWrapper from "@/app/kiosk/components/IdleRedirectWrapper";
import {
  KioskLayoutClasses,
  KioskLayoutStyle,
} from "@/app/kiosk/constants/kioskLayout";
import { KIOSK_ROUTES } from "@/app/kiosk/constants/kioskNavigation";

/** Props for {@link MainKioskLayout}. */
interface MainKioskLayoutProps {
  /** The current kiosk page (or nested kiosk layout). */
  children: React.ReactNode;
}

/**
 * Isolated top navigation component consuming search parameters inside Suspense.
 *
 * @remarks
 * Renders the top navigation header containing the contextual back button.
 *
 * @param props - Component props containing current pathname.
 * @returns Header element with contextual back button.
 */
function KioskBackNavigation({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();

  // Selected patient type ("new" | "old") from the URL, if present.
  const patientType = searchParams.get("type");

  const shouldShowBackButton =
    pathname === "/kiosk/pages/kiosk-services" ||
    pathname === "/kiosk/pages/kiosk-cubicle-selection" ||
    pathname === "/kiosk/pages/category-selection" ||
    pathname === "/kiosk/pages/sms-input";

  // Where the back button goes; undefined means no back target on this page.
  let backHref: string | undefined = undefined;

  if (pathname === "/kiosk/pages/kiosk-services") {
    backHref = "/kiosk/pages/kiosk-new-old-selection";
  }

  if (pathname === "/kiosk/pages/kiosk-cubicle-selection") {
    const serviceId = searchParams.get("serviceId");
    if (serviceId) {
      const params = new URLSearchParams();
      if (patientType) params.set("type", patientType);
      params.set("serviceId", serviceId);
      params.set("serviceLabel", "Consultation");
      backHref = `/kiosk/pages/category-selection?${params.toString()}`;
    } else {
      backHref = patientType
        ? `/kiosk/pages/kiosk-services?type=${encodeURIComponent(patientType)}`
        : "/kiosk/pages/kiosk-services";
    }
  }

  if (pathname === "/kiosk/pages/category-selection") {
    const serviceId = searchParams.get("serviceId");
    const params = new URLSearchParams();
    if (patientType) params.set("type", patientType);
    if (serviceId) params.set("serviceId", serviceId);
    const query = params.toString();
    backHref = `/kiosk/pages/kiosk-services${query ? `?${query}` : ""}`;
  }

  if (pathname === "/kiosk/pages/sms-input") {
    const serviceId = searchParams.get("serviceId");
    const subcategory = searchParams.get("subcategory");
    const preferredCubicleNums = searchParams.get("preferredCubicleNums");
    const serviceLabel = searchParams.get("serviceLabel");

    const params = new URLSearchParams();
    if (serviceId) params.set("serviceId", serviceId);
    if (patientType) params.set("type", patientType);

    if (preferredCubicleNums) {
      if (subcategory) params.set("subcategory", subcategory);
      backHref = `/kiosk/pages/kiosk-cubicle-selection?${params.toString()}`;
    } else if (subcategory) {
      if (serviceLabel) params.set("serviceLabel", serviceLabel);
      backHref = `/kiosk/pages/category-selection?${params.toString()}`;
    } else {
      backHref = `/kiosk/pages/kiosk-services?${params.toString()}`;
    }
  }

  return (
    <header
      className={KioskLayoutClasses.topNavWrapper}
      style={KioskLayoutStyle.topNavWrapper}
    >
      {/* Left Slot: Contextual Back Button */}
      <div className="flex items-center justify-start shrink-0">
        {shouldShowBackButton && backHref ? (
          <KioskBackButton href={backHref} />
        ) : null}
      </div>
    </header>
  );
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
      const isSameOrigin = anchor.origin === window.location.origin;

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
  const isSlideshow = pathname === KIOSK_ROUTES.SLIDESHOW;

  // The patient check-in kiosk is strictly light-mode only per institutional standards.
  // Isolated strictly to the kiosk shell lifecycle; does not mutate next-themes or affect other tabs.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      if (wasDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }
    };
  }, []);

  return (
    <KioskLoadingProvider>
      <KioskRouteChangeIndicator pathname={pathname} />
      <IdleRedirectWrapper />

      {isSlideshow ? (
        children
      ) : (
        <div
          className={KioskLayoutClasses.container(mounted)}
          style={KioskLayoutStyle.container}
        >
          <Suspense fallback={null}>
            <KioskBackNavigation pathname={pathname} />
          </Suspense>

          {/* Dedicated Persistent Step Process Strip directly below the Back button row */}
          <div className="w-full flex-shrink-0 flex justify-center items-center py-1 sm:py-1.5 px-3 sm:px-4 z-10 bg-transparent">
            <KioskStepProgress />
          </div>

          {/* Main content: fills all remaining space, no fixed dimensions. */}
          <main
            className={KioskLayoutClasses.main}
            style={KioskLayoutStyle.main}
          >
            {children}
          </main>

          {/* Footer: sized by its own content. */}
          <div
            className={KioskLayoutClasses.footerWrapper}
            style={KioskLayoutStyle.footerWrapper}
          >
            <KioskHeader />
          </div>
        </div>
      )}

      <KioskLoadingOverlay />
    </KioskLoadingProvider>
  );
}
