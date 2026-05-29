"use client";

import { useEffect, useState } from "react";

export default function ConfirmationLayout({children}: {children: React.ReactNode;}) {
  const [scale, setScale] = useState(1);
  // We will store the exact pixel dimensions needed to fill the screen
  const [dimensions, setDimensions] = useState({ width: 1080, height: 1920 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const virtualWidth = isLandscape ? 1920 : 1080;
      const virtualHeight = isLandscape ? 1080 : 1920;

      const scaleX = window.innerWidth / virtualWidth;
      const scaleY = window.innerHeight / virtualHeight;
      const finalScale = Math.min(scaleX, scaleY);
      
      setScale(finalScale);

      // THE FIX: Calculate the exact width/height needed to touch the monitor edges
      setDimensions({
        width: window.innerWidth / finalScale,
        height: window.innerHeight / finalScale
      });
      
      setMounted(true);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className={`w-screen h-screen overflow-hidden flex items-center justify-center bg-white transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* THE FIX: We apply the new edge-to-edge dimensions here */}
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center"
        }}
      >
        {/* Your page now has access to the full width of the monitor! */}
        <main className="h-full w-full">{children}</main>
      </div>

    </div>
  );
}