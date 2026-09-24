"use client";

import KioskTitle from "@/app/kiosk/pages/kiosk-new-old-selection/components/KioskTitle";
import PatientTypeBanner from "@/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeBanner";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";

/** Props for {@link KioskNewOldSelectionLayout}. */
interface KioskNewOldSelectionLayoutProps {
    /** The child page content (the patient category card grid). */
    children: React.ReactNode;
}

/**
 * Layout for `/kiosk/pages/kiosk-new-old-selection`.
 *
 * Provides a responsive presentation for the welcome screen:
 * - In landscape: a side-by-side two-column split with the hospital image on the
 *   left and the category options on the right.
 * - In portrait: a centered single-column stack.
 *
 * @remarks
 * Bottom padding (`pb-[120px]` landscape, `pb-[140px]` portrait) is reserved
 * so the interactive cards remain safely above the curved kiosk wave footer.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The responsive layout container for patient category selection.
 */
export default function KioskNewOldSelectionLayout({
    children,
}: KioskNewOldSelectionLayoutProps) {
    const isLandscape = useIsLandscape();
    const mounted = useIsMounted();

    return (
        <div
            className={`fixed inset-0 flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}
        >
            <main
                className={`flex h-full w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                    isLandscape ? "pb-[120px]" : "pb-[140px]"
                }`}
            >
                <div className="m-auto flex w-full items-center justify-center">
                    {isLandscape ? (
                        /* LANDSCAPE DUAL-COLUMN VIEW */
                        <div className="flex w-[92%] max-w-[1750px] items-center justify-center gap-[4vw]">
                            {/* Left column: Hospital Title & Image */}
                            <div className="flex w-[45%] flex-col items-center justify-center">
                                <KioskTitle isLandscape={true} />
                            </div>

                            {/* Right column: Banner Instructions & Cards */}
                            <div className="flex w-[55%] flex-col items-center justify-center">
                                <PatientTypeBanner />
                                <div className="w-full">{children}</div>
                            </div>
                        </div>
                    ) : (
                        /* PORTRAIT STACKED VIEW */
                        <div className="flex w-full max-w-[900px] flex-col items-center justify-center px-[4vw]">
                            <KioskTitle isLandscape={false} />
                            <PatientTypeBanner />
                            <div className="w-full">{children}</div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}