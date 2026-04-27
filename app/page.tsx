'use client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

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
        <nav className="px-10 pt-8">
      <div className="flex items-center justify-between rounded-3xl px-8 py-5">
        <span className="text-lg font-bold text-gray-800">
          Heart Check <span className="text-[#cc3535]">PHC</span>
        </span>

        <div className="w-10" />

        <div className="text-right">
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer rounded-2xl bg-white/50 px-5 py-2 font-semibold text-[#cc3535] transition hover:bg-red-50 hover:text-red-700"
          >
            Staff Login
          </span>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center">
      <div className="rounded-[40px] px-16 py-14">
        <h1 className="mb-4 text-5xl font-black leading-tight text-gray-800">
          Heart Check{" "}
          <span className="text-[#cc3535] drop-shadow-[0_0_20px_rgba(204,53,53,0.25)]">
            PHC
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-500">
          A Queueing Management System for the Out-Patient Department
          of Philippine Heart Center
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => router.push("/monitor")}
            className="rounded-full bg-[#cc3535] px-10 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(204,53,53,0.25)] transition hover:bg-red-700 active:scale-95"
          >
            Monitor
          </button>

          <button
            onClick={() => router.push("/kiosk/kiosk-services")}
            className="rounded-full border border-white/50 bg-white/50 px-10 py-4 text-base font-bold text-[#cc3535] backdrop-blur-xl transition hover:bg-white/70 active:scale-95"
          >
            Patient Kiosk
          </button>
        </div>
      </div>
    </div>

    {/* Feature Cards */}
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-12 pb-20 sm:grid-cols-3">
      {[
        {
          icon: "bx-list-ol",
          title: "Queue Management",
          desc: "Real-time patient queue tracking across all services",
        },
        {
          icon: "bxs-message-dots",
          title: "SMS Notifications",
          desc: "Automatic SMS alerts when patients are called",
        },
        {
          icon: "bxs-bar-chart-alt-2",
          title: "Analytics",
          desc: "Daily reports and patient flow insights",
        },
      ].map((card) => (
        <div
          key={card.title}
          className="rounded-[28px] border border-white/40 bg-white/35 p-7 shadow-[0_10px_40px_rgba(255,120,120,0.06)] backdrop-blur-xl transition hover:scale-[1.02]"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/50">
            <i className={`bx ${card.icon} text-2xl text-[#cc3535]`} />
          </div>

          <h3 className="mb-2 text-base font-semibold text-gray-700">
            {card.title}
          </h3>

          <p className="text-sm leading-relaxed text-gray-500">
            {card.desc}
          </p>
        </div>
      ))}
    </div>

    {/* Footer */}
    <footer className="px-10 pb-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm text-gray-600">
            Heart Check{" "}
            <span className="font-medium text-[#cc3535]">PHC</span>
          </span>
        </div>
    </footer>
      </div>
  </div>
);
}