"use client";

import CubicleHeader from "@/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleHeader";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";
import { CubicleLayoutClasses } from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout";

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
        <div className={CubicleLayoutClasses.layoutOverlay(mounted)}>
            <div className={CubicleLayoutClasses.layoutContainer}>
                <div className={CubicleLayoutClasses.layoutMain(isLandscape)}>
                    <div className={CubicleLayoutClasses.layoutInner(isLandscape)}>
                        <CubicleHeader />
                        <div className={CubicleLayoutClasses.layoutChildren}>{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}