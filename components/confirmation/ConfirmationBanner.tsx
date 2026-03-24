import Image from "next/image";
import type { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function ServiceBanner({ service }: Props) {
    return (
        <div>
            <div className="relative flex justify-center items-center px-8 py-8 overflow-hidden"
            style={{background: service.bg_color}}
            >
            <span className="absolute -top-6 -right-6 w-35 h-35 rounded-full opacity-20 bg-white pointer-events-none" />
            <span className="absolute -bottom-10 -left-5 w-50 h-50 rounded-full opacity-20 bg-white pointer-events-none" />
            
            <Image
                src={service.icon_src}
                alt={service.label_en}
                width={120}
                height={120}
                className="w-30 h-30 drop-shadow-md"
            />
                <div className="relative z-10 flex flex-col text-white">
                    <span className="font-baloo font-black text-[70px]">{service.label_fil}</span>
                    <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-[30px] font-bold px-4 py-1 rounded-full">{service.label_en}</span>
                </div>
            </div>
        </div>
    );
}