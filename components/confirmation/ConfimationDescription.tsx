import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function ConfirmationDescriptions({service}: Props){
    return(
        <div className="border-[6px] m-8 p-8 border-dashed border-gray-700 rounded-[45px] flex-col items-center justify-center bg-white">
        <p className="mt-4 text-[50px] text-left text-gray-700 leading-relaxed font-baloo font-black">
        {service.description_fil}
        </p>
        <p className="mt-6 text-[50px] text-left text-sm text-gray-500">
        {service.description_en}
        </p>
        </div>
    );
}