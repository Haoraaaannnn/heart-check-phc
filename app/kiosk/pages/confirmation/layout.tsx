"use client";

import { useIsMounted } from "@/hooks/useIsMounted";

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
        <div
            className={`flex h-dvh w-dvw items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}
        >
            <main className="flex h-full w-full flex-col items-center">
                {children}
            </main>
        </div>
    );
}