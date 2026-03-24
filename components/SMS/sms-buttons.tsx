"use client";

import Link from "next/link";

interface Props {
  disabled: boolean;
  onClick: () => void;
}

export default function ContinueButton({ disabled, onClick }: Props) {
  return (
    <div>
      <button
      onClick={onClick}
      disabled={disabled}
      className={`mx-8 my-8 w-[calc(100%-4rem)] h-30 py-[18px] bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[50px] font-bold rounded-[45px] tracking-wide transition-all ${!disabled ? "active:scale-95" : ""}`}
      >
      Magpatuloy - Continue
    </button>
    <Link 
    href="/kiosk/kiosk-services"
    className="flex items-center justify-center mx-8 max-w-full py-[18px] h-30 bg-red-600 text-white text-center text-[50px] font-baloo font-black rounded-[45px] transition-all active:scale-90 shadow-xl"
    > Bumalik - Cancel
    </Link>
    </div>
  );
}