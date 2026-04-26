import React from "react";

export default function DashboardBg({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-[#fffdfd] via-[#fff5f5] to-[#ffeaea] font-sans">

      {/* Soft Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">

        {/* Top Right Large Glow */}
        <div className="absolute top-[-120px] right-[-100px] h-[520px] w-[520px] rounded-full bg-[#ff6b6b]/25 blur-[140px]" />

        {/* Center Hero Glow */}
        <div className="absolute top-[30%] left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8a8a]/20 blur-[160px]" />

        {/* Left Mid Glow */}
        <div className="absolute top-[45%] left-[-120px] h-[420px] w-[420px] rounded-full bg-[#ffb4b4]/20 blur-[120px]" />

        {/* Bottom Right Glow */}
        <div className="absolute bottom-[-150px] right-[10%] h-[500px] w-[500px] rounded-full bg-[#ff7b7b]/20 blur-[140px]" />

        {/* Bottom Center Soft Glow */}
        <div className="absolute bottom-[-180px] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#ffd6d6]/30 blur-[160px]" />

        {/* Subtle Floating Blur */}
        <div className="absolute top-[20%] left-[20%] h-[280px] w-[280px] rounded-full bg-white/40 blur-[100px]" />
      </div>

      {/* Glass Overlay Layer */}
      <div className="absolute inset-0 z-0 bg-white/20 backdrop-blur-[2px]" />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}