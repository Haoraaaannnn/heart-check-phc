"use client";

import CubicleHeader from "@/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleHeader";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";

/** Props for {@link KioskCubicleSelectionLayout}. */
interface KioskCubicleSelectionLayoutProps {
    /** Child content (the cubicle card grid). */
    children: React.ReactNode;
}

/**
 * Layout for `/kiosk/pages/kiosk-cubicle-selection`.
 *
 * Keeps the header and cubicle cards centered as a single block and scrolls
 * safely if more cubicles are configured than can fit above the footer.
 *
 * @remarks
 * Bottom padding (`pb-[120px]` in landscape, `pb-[140px]` in portrait)
 * preserves clearance for the floating wave footer.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The responsive cubicle selection container.
 */
export default function KioskCubicleSelectionLayout({
    children,
}: KioskCubicleSelectionLayoutProps) {
    const isLandscape = useIsLandscape();
    const mounted = useIsMounted();

    return (
        <div
            className={`fixed inset-0 flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="relative flex h-full w-full flex-col overflow-hidden">
                <main
                    className={`flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                        isLandscape ? "pb-[120px]" : "pb-[140px]"
                    }`}
                >
                    <div
                        className={`m-auto flex flex-col items-center ${
                            isLandscape ? "w-[92%] max-w-[1600px]" : "w-full max-w-[900px]"
                        }`}
                    >
                        <CubicleHeader />
                        <div className="w-full">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    );
}