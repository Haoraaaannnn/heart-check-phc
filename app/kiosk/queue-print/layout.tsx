"use client";

import UnviBackground from "@/components/universal/background";
import PrintHeader from "@/components/queue_Print/PrintHeader";
import PrintFooter from "@/components/queue_Print/PrintFooter";

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnviBackground>
      <PrintHeader/>
      <main className="flex-1 min-h-0 w-full overflow-hidden">{children}</main>
      <PrintFooter/>
    </UnviBackground>
  );
}
