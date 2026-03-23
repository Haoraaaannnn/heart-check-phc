import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function ConfirmationDescriptions({service}: Props){
    return(
        <div className="border-[6px] m-8 p-8 border-[2.5px] border-gray-700 rounded-[45px] flex-col items-center justify-center bg-white">
            <span className="inline-block bg-[#1565c0] text-white text-[40px] font-extrabold px-4 py-1 rounded-full mb-3">Ano ito? — What is this?</span>
        <p className="mt-4 text-[50px] text-left text-gray-700 leading-relaxed font-baloo font-black">
        {service.description_fil}
        </p>
        <div className="h-[2px] bg-[#e3f2fd] rounded my-3.5 border-[2.5px]" />
        <p className="mt-6 text-[50px] text-left text-sm text-gray-500">
        {service.description_en}
        </p>
        </div>
    );
}