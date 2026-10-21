"use client";

import PrintHeader from "@/app/kiosk/pages/queue-print/components/PrintHeader";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";
import { QueuePrintLayoutClasses } from "@/app/kiosk/pages/queue-print/constants/queuePrintLayout";

/** Props for {@link QueuePrintLayout}. */
interface QueuePrintLayoutProps {
    /** The printed ticket display content. */
    children: React.ReactNode;
}

/**
 * Shell layout for the ticket printing screen (`/kiosk/pages/queue-print`).
 *
 * @remarks
 * Renders the top "Thank You" header and provides a centered, non-scrolling
 * viewport container for the queue ticket confirmation and fallback actions.
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
        </div>
    );
}