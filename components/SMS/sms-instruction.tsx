import { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function SMSInstruction({service}: Props){
    return(
        <div className="w-full border-dashed flex items-center justify-center bg-white text-center
            border-[4px] portrait:lg:border-[6px] landscape:2xl:border-[6px]
            p-4 md:p-6 portrait:lg:p-8 landscape:2xl:p-8
            rounded-[20px] md:rounded-[30px] portrait:lg:rounded-[45px] landscape:2xl:rounded-[45px]
        "
        style={{borderColor: service.shadow_color}}>
            <span className="font-baloo font-black text-[#888] tracking-wide leading-tight
                text-lg md:text-3xl portrait:lg:text-[40px] landscape:lg:text-2xl landscape:2xl:text-[40px]
            ">
                Enter your phone number basta achuchuness to
            </span>
        </div>
    );
}