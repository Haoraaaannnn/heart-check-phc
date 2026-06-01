import React from "react";

export default function DashboardBg({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen font-sans">
    
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#fffdfd] via-[#fff5f5] to-[#ffeaea] dark:from-gray-950 dark:via-gray-900 dark:to-black transition-colors duration-500">
        <div className="absolute top-[-120px] right-[-100px] h-[520px] w-[520px] rounded-full bg-[#ff6b6b]/25 dark:bg-red-700/15 blur-[140px]" />
        <div className="absolute top-[30%] left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8a8a]/20 dark:bg-red-900/20 blur-[160px]" />
        <div className="absolute top-[45%] left-[-120px] h-[420px] w-[420px] rounded-full bg-[#ffb4b4]/20 dark:bg-rose-900/20 blur-[120px]" />
        <div className="absolute bottom-[-150px] right-[10%] h-[500px] w-[500px] rounded-full bg-[#ff7b7b]/20 dark:bg-red-800/15 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#ffd6d6]/30 dark:bg-red-950/40 blur-[160px]" />
        <div className="absolute top-[20%] left-[20%] h-[280px] w-[280px] rounded-full bg-white/40 dark:bg-white/5 blur-[100px]" />
        <div className="absolute inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {children}
      </div>
      
    </div>
  );
}