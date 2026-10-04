import React from "react";

export default function DashboardBg({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen font-sans">
    
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-white dark:bg-black duration-500">
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {children}
      </div>
      
    </div>
  );
}