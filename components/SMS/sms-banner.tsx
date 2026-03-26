import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function SMSBanner({service}: Props ){
    return(
        // Removed margins (mx-8 mt-8).
        <div className="relative z-10 w-full rounded-3xl md:rounded-[45px] px-4 md:px-6 py-3 md:py-4 overflow-hidden"
        style={{ background: service.bg_color, boxShadow: `0 4px 30px ${service.shadow_color}80`}}
        >
            <span className="absolute -top-6 -right-6 w-32 md:w-35 h-32 md:h-35 rounded-full opacity-20 bg-white pointer-events-none" />
            <span className="absolute -bottom-6 -left-3 w-40 md:w-50 h-40 md:h-50 rounded-full opacity-20 bg-white pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
                <span className="font-baloo font-black text-2xl sm:text-4xl md:text-5xl lg:text-[60px] leading-none mb-1 text-white">{service.label_fil}</span>
<span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-xs sm:text-sm md:text-xl lg:text-[30px] font-bold px-3 py-1 rounded-full">{service.label_en}</span>
            </div>
        </div>
    );
}