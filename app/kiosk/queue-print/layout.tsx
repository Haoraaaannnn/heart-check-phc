"use client";

import UnviBackground from "@/components/backgrounds/Univbackground";
import PrintHeader from "@/components/queue_Print/PrintHeader";
import PrintFooter from "@/components/queue_Print/PrintFooter";

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnviBackground>
      <PrintHeader />
      
      {/* 
        CHANGED: Added flex, items-center, justify-center, and padding directly to main.
        This forces whatever is inside (your card) to stay perfectly in the middle.
      */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-4 md:p-8">
        {children}
      </main>
      
      <PrintFooter />
    </UnviBackground>
  );
}