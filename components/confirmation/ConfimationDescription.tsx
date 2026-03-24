import { Service } from "@/types/Services";

interface Props{
    service: Service
    descColor: string
}

export default function ConfirmationDescriptions({service, descColor}: Props){
    return(
        <div className="border-[4px] m-8 p-8 border-[2.5px] border-gray-400 rounded-[45px] flex-col items-center justify-center bg-white">
            <span className="inline-block bg-[#1565c0] text-white text-[40px] font-extrabold px-8 py-1 rounded-full mb-3"
            style={{background:descColor}}>Ano ito? — What is this?</span>
        <p className="mt-4 text-[50px] text-left text-gray-700 leading-relaxed font-baloo font-black">
        {service.description_fil}
        </p>
        <div className="h-[2px] bg-gray-400 rounded my-3.5 border-[2px]" />
        <p className="mt-6 text-[50px] text-left text-sm text-gray-500">
        {service.description_en}
        </p>
        </div>
    );
}