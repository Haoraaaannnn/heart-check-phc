"use client";

import Link from "next/link";
import { Service } from "@/types/Services";

interface Props {
  service: Service
  disabled: boolean;
  onClick: () => void;
  onSkip: () => void;
}

export default function ContinueButton({ disabled, onClick, onSkip, service }: Props) {
  return (
    <div className="mx-8 flex-col gap4">
      <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-30 py-[18px] bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[50px] font-bold rounded-[45px] tracking-wide transition-all ${!disabled ? "active:scale-95" : ""}`}
      style={{background: service.bg_color}}>
      Magpatuloy - Continue
    </button>
      <div className="flex flex-row justify-between items-center my-8 gap-4 w-full">
        <Link 
          href="/kiosk/kiosk-services"
          className="flex-1 items-center justify-center py-[18px] h-30 border-[6px] border-gray-400 text-gray-400 text-center text-[50px] font-baloo font-black rounded-[45px] transition-all active:scale-90 shadow-xl"
          > Bumalik - Cancel
        </Link>
        <button
          onClick={onSkip}
          className="flex-1 items-center justify-center h-30 border-[6px] border-gray-400 text-gray-400 text-[50px] font-baloo font-black rounded-[45px] transition-all active:scale-95 shadow-2xl">
            Laktawan-Skip
        </button>
      </div>
    </div>
  );
}