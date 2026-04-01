"use client";

import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function SMSBanner({service}: Props ){
    return(
        <div className="relative z-10 w-full rounded-3xl md:rounded-[45px] lg:rounded-[50px] px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 landscape:py-2 landscape:lg:py-3 overflow-hidden"
        style={{ background: service.bg_color, boxShadow: `0 4px 30px ${service.shadow_color}80`}}
        >
            {/* Background Decorations - Scaled down in landscape */}
            <span className="absolute -top-6 -right-6 w-32 md:w-35 lg:w-40 landscape:w-20 landscape:lg:w-24 h-32 md:h-35 lg:h-40 landscape:h-20 landscape:lg:h-24 rounded-full opacity-20 bg-white pointer-events-none" />
            <span className="absolute -bottom-6 -left-3 w-40 md:w-50 lg:w-60 landscape:w-24 landscape:lg:w-32 h-40 md:h-50 lg:h-60 landscape:h-24 landscape:lg:h-32 rounded-full opacity-20 bg-white pointer-events-none" />

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