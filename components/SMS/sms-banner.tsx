import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function SMSBanner({service}: Props ){
    return(
        <div className="relative z-10 mx-8 mt-8  rounded-[45px] px-6 py-4 overflow-hidden"
        style={{ background: service.bg_color, boxShadow: `0 4px 30px ${service.shadow_color}80`}}
        >
            <span className="absolute -top-6 -right-6 w-35 h-35 rounded-full opacity-20 bg-white pointer-events-none" />
            <span className="absolute -bottom-6 -left-3 w-50 h-50 rounded-full opacity-20 bg-white pointer-events-none" />

            <div className="relative z-10 flex flex-col flex-1 min-w-0   text-white">
                <span className="font-baloo font-black text-[45px]">{service.label_fil}</span>
                <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-[20px] font-bold px-4 py-1 rounded-full">{service.label_en}</span>
            </div>
        </div>
    );
}