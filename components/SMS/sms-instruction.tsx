import { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function SMSInstruction({service}: Props){
    return(
        <div className="border-[6px] my-8 mx-8 h-[300px] border-dashed rounded-[45px] flex items-center justify-center bg-white"
        style={{borderColor: service.shadow_color}}>
            <span className="text-[15px] font-baloo font-black text-[40px] text-[#888] tracking-wide">Enter your phone number basta achuchuness to</span>
        </div>
    );
}