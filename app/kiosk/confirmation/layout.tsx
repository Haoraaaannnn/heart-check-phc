//bg
//banner
//description
//button(confirm and cancel)

"use client";

export default function KioskLayout({children,}: {children: React.ReactNode;}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main>{children}</main>
    </div>
  );
}
