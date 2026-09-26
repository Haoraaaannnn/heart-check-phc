"use client";

import { useIsMounted } from "@/hooks/useIsMounted";
import { ConfirmationLayoutClasses } from "@/app/kiosk/pages/confirmation/constants/confirmationLayout";

/** Props for {@link ConfirmationLayout}. */
interface ConfirmationLayoutProps {
    /** The confirmation page contents. */
    children: React.ReactNode;
}

/**
 * Shell layout for the standalone confirmation route (`/kiosk/pages/confirmation`).
 *
 * @param props - Layout props provided by Next.js.
 * @returns The centered confirmation view with smooth hydration fade-in.
 */
export default function ConfirmationLayout({ children }: ConfirmationLayoutProps) {
    const mounted = useIsMounted();

    return (
        <div className={ConfirmationLayoutClasses.layoutOverlay(mounted)}>
            <main className={ConfirmationLayoutClasses.layoutMain}>
                {children}
            </main>
        </div>
    );
}