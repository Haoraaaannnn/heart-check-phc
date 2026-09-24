"use client";

import KioskBanner from "@/app/kiosk/pages/kiosk-services/components/KioskBanner";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";

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
        <div
            className={`fixed inset-0 flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="relative flex h-full w-full flex-col overflow-hidden">
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
                <main
                    className={`flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                        isLandscape ? "pb-[120px]" : "pb-[140px]"
                    }`}
                >
                    <div
                        className={`m-auto flex flex-col items-center ${
                            isLandscape ? "w-[92%] max-w-[1600px]" : "w-full"
                        }`}
                    >
                        <KioskBanner />

                        <div className="w-full">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}