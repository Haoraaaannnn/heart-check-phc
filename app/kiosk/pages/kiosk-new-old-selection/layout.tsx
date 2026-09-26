"use client";

import KioskTitle from "@/app/kiosk/pages/kiosk-new-old-selection/components/KioskTitle";
import PatientTypeBanner from "@/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeBanner";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";
import { KioskNewOldLayoutClasses } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout";

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
        <div className={KioskNewOldLayoutClasses.layoutOverlay(mounted)}>
            <main className={KioskNewOldLayoutClasses.layoutMain(isLandscape)}>
                <div className={KioskNewOldLayoutClasses.layoutCenterWrapper}>
                    {isLandscape ? (
                        /* LANDSCAPE DUAL-COLUMN VIEW */
                        <div className={KioskNewOldLayoutClasses.layoutLandscapeRow}>
                            {/* Left column: Hospital Title & Image */}
                            <div className={KioskNewOldLayoutClasses.layoutLandscapeLeftCol}>
                                <KioskTitle isLandscape={true} />
                            </div>

                            {/* Right column: Banner Instructions & Cards */}
                            <div className={KioskNewOldLayoutClasses.layoutLandscapeRightCol}>
                                <PatientTypeBanner />
                                <div className={KioskNewOldLayoutClasses.layoutChildrenWrapper}>{children}</div>
                            </div>
                        </div>
                    ) : (
                        /* PORTRAIT STACKED VIEW */
                        <div className={KioskNewOldLayoutClasses.layoutPortraitStack}>
                            <KioskTitle isLandscape={false} />
                            <PatientTypeBanner />
                            <div className={KioskNewOldLayoutClasses.layoutChildrenWrapper}>{children}</div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}