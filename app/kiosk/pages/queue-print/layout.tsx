"use client";

import PrintHeader from "@/app/kiosk/pages/queue-print/components/PrintHeader";
import PrintFooter from "@/app/kiosk/pages/queue-print/components/PrintFooter";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";

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
        <div
            className={`min-h-full w-full flex flex-col justify-between overflow-hidden bg-white transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            } ${isLandscape ? "pb-4" : "pb-6"}`}
        >
            <PrintHeader />
            <main className="flex-1 min-h-0 w-full flex items-center justify-center p-4 md:p-6">
                {children}
            </main>
            <PrintFooter />
        </div>
    );
}