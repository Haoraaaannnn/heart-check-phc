import { Service } from "@/types/Services";

interface Props { service: Service; }

export default function SMSInstruction({service}: Props){
    return(
        <div className="w-full border-dashed border-[0.4vh] p-[2vh] bg-white text-center rounded-[2vh]" style={{borderColor: service.shadow_color}}>
            <p className="font-baloo font-black text-[#888] leading-tight text-[min(2.5vh,30px)]">
                Pakilagay ang inyong numero ng telepono sa format na ito:
            </p>
            <p className="font-baloo font-black text-[#888] leading-tight text-[min(2.5vh,30px)]">
                Please enter your phone number in this format:
            </p>
        </div>
    );
}