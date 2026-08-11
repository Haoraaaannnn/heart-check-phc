"use client";

import { useEffect, useState } from "react";
import KioskTitle from "@/app/kiosk/kiosk-new-old-selection/components/KioskTitle";
import PatientTypeBanner from "@/app/kiosk/kiosk-new-old-selection/components/PatientTypeBanner";

export default function KioskNewOldSelectionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [scale, setScale] = useState(1);
    const [isLandscape, setIsLandscape] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const updateScale = () => {
            const landscape = window.innerWidth > window.innerHeight;

            setIsLandscape(landscape);

            const virtualWidth = landscape ? 1920 : 1080;
            const virtualHeight = landscape ? 1080 : 1920;

            const scaleX = window.innerWidth / virtualWidth;
            const scaleY = window.innerHeight / virtualHeight;

            setScale(Math.min(scaleX, scaleY) || 1);
            setMounted(true);
        };

        updateScale();

        window.addEventListener("resize", updateScale);
        window.addEventListener("orientationchange", updateScale);

        return () => {
            window.removeEventListener("resize", updateScale);
            window.removeEventListener(
                "orientationchange",
                updateScale
            );
        };
    }, []);

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center overflow-hidden bg-white transition-opacity duration-300 ${
                mounted ? "opacity-100" : "opacity-0"
            }`}
        >
            {/* Virtual Kiosk Screen */}
            <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{
                    width: isLandscape ? "1920px" : "1080px",
                    height: isLandscape ? "1080px" : "1920px",
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                }}
            >
                {/* CENTERED CONTENT */}
                <main className="flex h-full w-full items-center justify-center overflow-hidden">

                    {isLandscape ? (
                        /* =========================
                           LANDSCAPE
                           ========================= */
                        <div className="flex w-[90%] max-w-[1750px] items-center justify-center gap-[80px]">

                            {/* LEFT: TITLE + IMAGE */}
                            <div className="flex w-[45%] flex-col items-center justify-center">
                                <KioskTitle isLandscape={true} />
                            </div>

                            {/* RIGHT: BANNER + CARDS */}
                            <div className="flex w-[55%] flex-col items-center justify-center">
                                <PatientTypeBanner />

                                <div className="w-full">
                                    {children}
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* =========================
                           PORTRAIT
                           ========================= */
                        <div className="flex w-full flex-col items-center justify-center px-[40px]">

                            {/* TITLE + IMAGE */}
                            <KioskTitle isLandscape={false} />

                            {/* BANNER */}
                            <PatientTypeBanner />

                            {/* CARDS */}
                            <div className="w-full">
                                {children}
                            </div>

                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}