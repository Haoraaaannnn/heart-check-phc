"use client";

import { useEffect, useState } from "react";
import KioskHeader from "@/app/kiosk/kiosk-services/components/KioskHeader";
import KioskBanner from "@/app/kiosk/kiosk-services/components/KioskBanner";

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
      
      setScale(Math.min(scaleX, scaleY));
      
      setMounted(true); 
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
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
            <KioskHeader />
            <KioskBanner />
              <main className="flex-grow">
                {children}
              </main>
          </div>
      </div>
    </div>
  );
}