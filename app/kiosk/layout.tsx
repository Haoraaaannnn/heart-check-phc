"use client";

import { usePathname, useSearchParams } from "next/navigation";
import KioskHeader from "@/app/kiosk/kiosk-services/components/KioskHeader";
import KioskBackButton from "@/components/reusables/KioskBackButton";
import { useIsMounted } from "@/hooks/useIsMounted";

/** Props for {@link MainKioskLayout}. */
interface MainKioskLayoutProps {
    /** The current kiosk page (or nested kiosk layout). */
    children: React.ReactNode;
}

/**
 * Root layout for every `/kiosk/*` route.
 *
 * Provides the full-screen shell shared by all kiosk pages: an optional back
 * button, the main content area, and the bottom footer (`KioskHeader`).
 *
 * @remarks
 * Back button rules:
 * - Only shown on `/kiosk/kiosk-services`, `/kiosk/kiosk-cubicle-selection`
 *   and `/kiosk/consultation-category`.
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
        pathname === "/kiosk/kiosk-services" ||
        pathname === "/kiosk/kiosk-cubicle-selection" ||
        pathname === "/kiosk/consultation-category";

    // Where the back button goes; undefined means no back target on this page.
    let backHref: string | undefined = undefined;

    if (pathname === "/kiosk/kiosk-services") {
        backHref = "/kiosk/kiosk-new-old-selection";
    }

    if (pathname === "/kiosk/kiosk-cubicle-selection") {
        backHref = patientType
            ? `/kiosk/kiosk-services?type=${encodeURIComponent(patientType)}`
            : "/kiosk/kiosk-services";
    }

    if (pathname === "/kiosk/consultation-category") {
        const serviceId = searchParams.get("serviceId");
        const params = new URLSearchParams();
        if (patientType) params.set("type", patientType);
        if (serviceId) params.set("serviceId", serviceId);
        const query = params.toString();
        backHref = `/kiosk/kiosk-services${query ? `?${query}` : ""}`;
    }

    return (
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
    );
}