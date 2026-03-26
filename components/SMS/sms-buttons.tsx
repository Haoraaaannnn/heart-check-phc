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
    <div className="flex flex-col w-full">
      <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full font-bold tracking-wide whitespace-nowrap overflow-hidden transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ${!disabled ? "active:scale-95" : ""}
        
        /* THE FIX: Increased the vertical padding (py) so the button is much taller */
        py-4 md:py-[24px] portrait:lg:py-[35px] landscape:2xl:py-[35px]
        
        rounded-[20px] md:rounded-[30px] portrait:lg:rounded-[45px] landscape:2xl:rounded-[45px]
        text-xl md:text-4xl portrait:lg:text-[50px] landscape:lg:text-3xl landscape:2xl:text-[50px]
      `}
      style={{background: service.bg_color}}>
      Magpatuloy - Continue
    </button>
      
      <div className="flex flex-row justify-between items-center gap-2 md:gap-4 w-full mt-3 md:mt-6">
        <Link 
          href="/kiosk/kiosk-services"
          className="flex-1 flex items-center justify-center font-baloo font-black text-gray-400 border-gray-400 text-center whitespace-nowrap overflow-hidden transition-all active:scale-90
            
            /* Made the secondary buttons taller here too to match */
            py-3 md:py-[20px] portrait:lg:py-[28px] landscape:2xl:py-[28px]
            
            border-[4px] portrait:lg:border-[6px] landscape:2xl:border-[6px]
            rounded-[20px] md:rounded-[30px] portrait:lg:rounded-[45px] landscape:2xl:rounded-[45px]
            text-sm md:text-3xl portrait:lg:text-[50px] landscape:lg:text-2xl landscape:2xl:text-[50px]
            shadow-md portrait:lg:shadow-xl landscape:2xl:shadow-xl
          "
          > Bumalik - Cancel
        </Link>
        <button
          onClick={onSkip}
          className="flex-1 flex items-center justify-center font-baloo font-black text-gray-400 border-gray-400 text-center whitespace-nowrap overflow-hidden transition-all active:scale-95
            
            /* Made the secondary buttons taller here too to match */
            py-3 md:py-[20px] portrait:lg:py-[28px] landscape:2xl:py-[28px]
            
            border-[4px] portrait:lg:border-[6px] landscape:2xl:border-[6px]
            rounded-[20px] md:rounded-[30px] portrait:lg:rounded-[45px] landscape:2xl:rounded-[45px]
            text-sm md:text-3xl portrait:lg:text-[50px] landscape:lg:text-2xl landscape:2xl:text-[50px]
            shadow-md portrait:lg:shadow-xl landscape:2xl:shadow-xl
          ">
            Laktawan-Skip
        </button>
      </div>
    </div>
  );
}