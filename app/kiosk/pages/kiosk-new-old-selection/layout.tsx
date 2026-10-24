"use client";

import KioskTitle from "@/app/kiosk/pages/kiosk-new-old-selection/components/KioskTitle";
import PatientTypeBanner from "@/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeBanner";
import { useIsMounted } from "@/hooks/useIsMounted";
import { KioskNewOldLayoutClasses } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout";

/** Props for {@link KioskNewOldSelectionLayout}. */
interface KioskNewOldSelectionLayoutProps {
    /** The child page content (the patient category card grid). */
    children: React.ReactNode;
}

/**
 * Unified centered layout for `/kiosk/pages/kiosk-new-old-selection`.
 *
 * Centers hospital branding, building hero photo, greetings banner,
 * and patient category cards in a single, balanced vertical flow
 * with zero text wrapping.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The responsive centered layout container for patient category selection.
 */
export default function KioskNewOldSelectionLayout({
    children,
}: KioskNewOldSelectionLayoutProps) {
    const mounted = useIsMounted();

    return (
        <div className={KioskNewOldLayoutClasses.layoutOverlay(mounted)}>
            <div className={KioskNewOldLayoutClasses.layoutContainer}>
                <div className={KioskNewOldLayoutClasses.unifiedWrapper}>
                    {/* Hospital Branding Header & Building Image */}
                    <header className={KioskNewOldLayoutClasses.portraitHeaderWrapper}>
                        <KioskTitle isLandscape={false} />
                    </header>

                    {/* Welcome Greeting & Instruction Banner (No Text Wrap) */}
                    <div className={KioskNewOldLayoutClasses.bannerWrapper}>
                        <PatientTypeBanner />
                    </div>

                    {/* Patient Category Cards (Centered) */}
                    <div className={KioskNewOldLayoutClasses.cardsArea}>
                        <div className={KioskNewOldLayoutClasses.layoutChildrenWrapper}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}