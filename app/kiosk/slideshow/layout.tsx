"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function KioskSlideshowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    router.push(`/kiosk/kiosk-new-old-selection`);
  };

  return (
    <div
      className="w-full flex-1 min-h-0 bg-white flex items-center justify-center p-4"
      onClick={handleStart}
    >
      <div className="w-full max-w-[1200px] h-full max-h-[80vh] sm:max-h-[70vh] md:max-h-[75vh] rounded-lg overflow-hidden relative border border-gray-200 flex items-center justify-center bg-white">
        <div className="absolute inset-0 flex items-center justify-center select-none">
          <span className="text-6xl sm:text-8xl md:text-9xl lg:text-[7rem] font-black text-red-700">
            {index + 1}
          </span>
        </div>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${i === index ? "bg-red-700" : "bg-red-200"}`}
            />
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
