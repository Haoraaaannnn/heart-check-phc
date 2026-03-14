"use client";

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className=" bg-[#2B59FF] text-white text-center p-10 rounded-b-[50px] shadow-lg">
        <h1 className="text-4xl">Maraming Salamat po!</h1>
        <p>hindi ko alam lalagay ko huhuhu</p>
      </header>
      <main>{children}</main>
      <footer className="bg-[#2B59FF] text-white text-center p-8 rounded-t-[50px] shadow-inner mt-auto"></footer>
    </div>
  );
}
