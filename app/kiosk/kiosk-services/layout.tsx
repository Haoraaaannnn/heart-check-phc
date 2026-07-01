"use client";

import { useEffect, useState } from "react";
import KioskHeader from "@/app/kiosk/kiosk-services/components/KioskHeader";
import KioskBanner from "@/app/kiosk/kiosk-services/components/KioskBanner";
import KioskTitle from "@/app/kiosk/kiosk-services/components/KioskTitle";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
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

    const initialUpdate = () => {
      requestAnimationFrame(updateScale);
      setTimeout(updateScale, 50);
    };

    initialUpdate();
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, []);


  return (
    <div className={`w-screen h-screen overflow-hidden flex items-center justify-center bg-white relative transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="flex-shrink-0 z-10 transition-transform duration-300 ease-in-out"
        style={{
          width: isLandscape ? '1920px' : '1080px',
          height: isLandscape ? '1080px' : '1920px',
          transform: `scale(${scale})`,
          transformOrigin: "center center"
        }}
      >
          <div className="relative z-10 flex flex-col h-full w-full">
            <div className={`flex flex-1 min-h-0 ${isLandscape ? "flex-row" : "flex-col"}`}>
              <section className={isLandscape ? "w-[45%] flex-shrink-0 overflow-hidden" : "w-full"}>
                <KioskTitle isLandscape={isLandscape} />
              </section>
              <section className={isLandscape ? "w-[55%] flex flex-col min-h-0" : "w-full flex flex-col"}>
                <KioskBanner />
                <main className={`flex-1 ${isLandscape ? "overflow-hidden" : ""}`}>
                  {children}
                </main>
              </section>
            </div>
            <KioskHeader />
          </div>
      </div>
    </div>
  );
}