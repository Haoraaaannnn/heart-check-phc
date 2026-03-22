"use client";

import KioskBackground from "@/components/kiosk/KioskBackground";
import KioskHeader from "@/components/kiosk/KioskHeader";
import KioskBanner from "@/components/kiosk/KioskBanner";

export default function KioskLayout({children,}: {children: React.ReactNode;}) {
  return (
    <KioskBackground >
      <KioskHeader/>
      <KioskBanner/>
      <main>{children}</main>
    </KioskBackground>
  );
}

//<main className="flex flex-col items-center justify-center w-full">{children}</main>