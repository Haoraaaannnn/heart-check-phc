import type { ReactNode } from "react";

/** Props for {@link KioskCubicleSelectionLayout}. */
interface KioskCubicleSelectionLayoutProps {
    /** Child content (the cubicle selection page). */
    children: ReactNode;
}

/**
 * Layout pass-through for `/kiosk/pages/kiosk-cubicle-selection`.
 *
 * Sits inside `MainKioskLayout` and passes the page content directly
 * to ensure alignment matches `category-selection`.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The page content.
 */
export default function KioskCubicleSelectionLayout({
    children,
}: KioskCubicleSelectionLayoutProps) {
    return <>{children}</>;
}