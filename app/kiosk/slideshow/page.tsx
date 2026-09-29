<<<<<<< Updated upstream
export default function Page() {
  return <>{/* Slideshow page is rendered by the layout. */}</>;
=======
/**
 * Kiosk slideshow landing screen.
 *
 * This route is the valid destination used by the inactivity redirect in
 * `IdleRedirectWrapper`. It provides a simple full-screen slideshow so the
 * kiosk can return to an idle presentation state after a period of inactivity.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/1.jpg",
  },
  {
    image: "/images/2.jpg",
  },
  {
    image: "/images/3.jpg",
  },
] as const;

/**
 * Displays a looped kiosk slideshow while the device is idle.
 *
 * @returns The fullscreen slideshow page shown after inactivity.
 */
export default function KioskSlideshowPage() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClick = () => {
      router.push("/kiosk/pages/kiosk-new-old-selection");
    };

    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, [router]);

  const slide = slides[slideIndex];

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_52%)] bg-[#021f35] text-white">
      <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-[#022a3c] via-[#072d4b] to-[#1f1747]">
        <div className="absolute inset-0 opacity-100">
          <img
            src={slide.image}
            alt="Kiosk slide"
            className="h-full w-full object-cover object-center scale-105"
          />
        </div>

        <div className="absolute inset-x-0 bottom-8 flex justify-center gap-3">
          {slides.map((item, index) => (
            <span
              key={`${item.image}-${index}`}
              className={[
                "h-3 w-12 rounded-full transition-all duration-300",
                index === slideIndex
                  ? "bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.9)]"
                  : "bg-slate-500/70",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </main>
  );
>>>>>>> Stashed changes
}
