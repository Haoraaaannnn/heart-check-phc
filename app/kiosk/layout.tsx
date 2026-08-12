"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import KioskHeader from "@/app/kiosk/kiosk-services/components/KioskHeader";
import KioskBackButton from "@/app/kiosk/kiosk-services/components/KioskBackButton";

const backRoute: Record<string, string> = {
    "/kiosk/kiosk-services": "/kiosk/kiosk-new-old-selection",
    "/kiosk/kiosk-cubicle-selection": "/kiosk/kiosk-services"
};

export default function MainKioskLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [scale, setScale] = useState(1);
    const [isLandscape, setIsLandscape] = useState(false);
    const [mounted, setMounted] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            const landscape = width > height;

            setIsLandscape(landscape);

            const virtualWidth = landscape ? 1920 : 1080;
            const virtualHeight = landscape ? 1080 : 1920;

            const scaleX = width / virtualWidth;
            const scaleY = height / virtualHeight;

            setScale(Math.min(scaleX, scaleY));
            setMounted(true);
        };

        updateScale();

        window.addEventListener("resize", updateScale);
        window.addEventListener("orientationchange", updateScale);

        return () => {
            window.removeEventListener("resize", updateScale);
            window.removeEventListener("orientationchange", updateScale);
        };
    }, []);

    const virtualWidth = isLandscape ? 1920 : 1080;
    const virtualHeight = isLandscape ? 1080 : 1920;

    const backHref = backRoute[pathname] ?? "null";

    return (
        <div
            className={`fixed inset-0 overflow-hidden bg-white flex items-center justify-center transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}
        >
            <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{
                    width: `${virtualWidth}px`,
                    height: `${virtualHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                }}
            >
                <div className="relative flex h-full w-full flex-col overflow-hidden">

                    {/* Backbutton */}
                    {backRoute[pathname] && (
                        <KioskBackButton href={backRoute[pathname]} />
                    )}

                    {/* Main content */}
                    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {children}
                    </main>

                    {/* Bottom header/footer */}
                    <div className="flex-shrink-0">
                        <KioskHeader />
                    </div>

                </div>
            </div>
        </div>
    );
}