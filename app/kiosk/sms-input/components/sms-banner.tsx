"use client";

import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function SMSBanner({service}: Props ){
    return(
        <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 landscape:py-2 landscape:lg:py-3 bg-[#7f0407]"
        >
            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Main Label */}
                <span className="font-baloo font-black text-2xl sm:text-4xl md:text-5xl lg:text-[65px] portrait:lg:text-[70px] landscape:text-xl landscape:lg:text-[35px] leading-none mb-1 text-white">
                    {service.label_fil}
                </span>
                
                {/* Sub Label */}
                <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-xs sm:text-sm md:text-xl lg:text-[32px] portrait:lg:text-[35px] landscape:text-[10px] landscape:lg:text-[18px] font-bold px-3 py-0.5 landscape:py-0 rounded-full">
                    {service.label_en}
                </span>
            </div>
        </div>
    );
}