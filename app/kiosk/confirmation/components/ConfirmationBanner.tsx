import Image from "next/image";
import type { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function ServiceBanner({ service }: Props) {
    return (
        <div>
            <div className="relative flex justify-center items-center px-4 md:px-6 py-4 md:py-6 overflow-hidden"
            style={{background: service.bg_color}}
            >
            <span className="absolute -top-6 -right-6 md:-top-8 md:-right-8 w-24 md:w-35 h-24 md:h-35 rounded-full opacity-20 bg-white pointer-events-none" />
            <span className="absolute -bottom-8 -left-4 md:-bottom-10 md:-left-5 w-32 md:w-50 h-32 md:h-50 rounded-full opacity-20 bg-white pointer-events-none" />
            
            <Image
                src={service.icon_src}
                alt={service.label_en}
                width={120}
                height={120}
                className="w-20 md:w-30 h-20 md:h-30 drop-shadow-md"
            />
                <div className="relative z-10 flex flex-col text-white p-4 md:p-8">
                    <span className="font-baloo font-black text-3xl md:text-5xl lg:text-[70px]">{service.label_fil}</span>
                    <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-lg md:text-2xl lg:text-[30px] font-bold px-3 md:px-4 py-1 rounded-full">{service.label_en}</span>
                </div>
            </div>
        </div>
    );
}