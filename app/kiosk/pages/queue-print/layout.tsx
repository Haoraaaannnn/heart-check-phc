"use client";

import PrintHeader from "@/app/kiosk/pages/queue-print/components/PrintHeader";
import PrintFooter from "@/app/kiosk/pages/queue-print/components/PrintFooter";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";
import { QueuePrintLayoutClasses } from "@/app/kiosk/pages/queue-print/constants/queuePrintLayout";

/** Props for {@link QueuePrintLayout}. */
interface QueuePrintLayoutProps {
    /** The printed ticket display card. */
    children: React.ReactNode;
}

/**
 * Shell layout for the ticket printing screen (`/kiosk/pages/queue-print`).
 *
 * @remarks
 * Renders the top "Thank You" header, centers the ticket number card,
 * and displays the bottom printing and registration instructions.
 *
 * @param props - Layout props provided by Next.js.
 * @returns The structured print confirmation screen.
 */
export default function QueuePrintLayout({ children }: QueuePrintLayoutProps) {
    const isLandscape = useIsLandscape();
    const mounted = useIsMounted();

    return (
        <div className={QueuePrintLayoutClasses.layoutContainer(mounted, isLandscape)}>
            <PrintHeader />
            <main className={QueuePrintLayoutClasses.layoutMain}>
                {children}
            </main>
            <PrintFooter />
        </div>
    );
}