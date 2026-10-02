import type { ReactNode } from "react";

/** Props for {@link KioskLayout}. */
interface KioskLayoutProps {
    /** The page rendered inside this layout (the services grid). */
    children: ReactNode;
}

/**
 * Layout pass-through for `/kiosk/pages/kiosk-services`.
 *
 * Sits inside `MainKioskLayout` and passes the page content directly
 * to ensure alignment matches `category-selection`.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The page content.
 */
export default function KioskLayout({ children }: KioskLayoutProps) {
    return <>{children}</>;
}