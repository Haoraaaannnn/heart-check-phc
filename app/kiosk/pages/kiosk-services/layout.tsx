"use client";

import KioskBanner from "@/app/kiosk/pages/kiosk-services/components/KioskBanner";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";
import { KioskServicesClasses } from "@/app/kiosk/pages/kiosk-services/constants/kioskServices";

/** Props for {@link KioskLayout}. */
interface KioskLayoutProps {
    /** The page rendered inside this layout (the services grid). */
    children: React.ReactNode;
}

/**
 * Layout for `/kiosk/pages/kiosk-services`.
 *
 * Renders the banner and the services grid as one vertically centered group
 * that scrolls when the cards don't fit above the footer.
 *
 * @remarks
 * Where it sits in the tree:
 * ```text
 * app/kiosk/layout.tsx (MainKioskLayout)
 *   -> back button, <main>, KioskHeader (footer with logo + clock)
 *        -> THIS layout
 *             -> KioskBanner + page.tsx (KioskServicesGrid)
 * ```
 *
 * The bottom padding (`pb-[120px]` landscape, `pb-[140px]` portrait) must
 * match the KioskHeader footer height. This layout is `fixed inset-0`, so it
 * covers the footer and needs that space reserved manually.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The scrollable, centered banner + services content.
 */
export default function KioskLayout({ children }: KioskLayoutProps) {
    // True when the window is wider than tall (kiosk mounted sideways).
    const isLandscape = useIsLandscape();

    // False until hydration finishes, so the page fades in instead of
    // flashing the wrong layout on first paint.
    const mounted = useIsMounted();

    return (
        <div className={KioskServicesClasses.layoutOverlay(mounted)}>
            <div className={KioskServicesClasses.layoutContainer}>
                {/*
                    Scrollable content area.
                    Centering uses `m-auto` on the inner wrapper instead of
                    `items-center` here: with items-center, content taller than
                    the area overflows equally at top and bottom and
                    overflow-hidden clips both ends (the cut-off heading and
                    last card bug). m-auto centers short content and lets tall
                    content start at the top and scroll.
                    Scrollbar is hidden because this is a touch kiosk.
                */}
                <main className={KioskServicesClasses.layoutMain(isLandscape)}>
                    <div className={KioskServicesClasses.layoutInner(isLandscape)}>
                        <KioskBanner />

                        <div className={KioskServicesClasses.layoutChildren}>{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}