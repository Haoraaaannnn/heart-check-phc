import { Service } from "@/types/Services";

interface Props {
    service: Service
    descColor: string
}

export default function ConfirmationDescriptions({service, descColor}: Props){
    return(
        <div className="flex flex-col items-start mx-8 mt-6 p-8 border-[2.5px] border-gray-400 rounded-[24px] bg-white shadow-sm">
            <span 
                className="inline-block text-white text-[40px] font-extrabold px-8 py-2 rounded-full mb-4 bg-[#7f0407]"
            >
                Ano ito? — What is this?
            </span>
            
            <p className="mt-2 text-[45px] text-left text-gray-700 leading-tight font-black">
                {service.description_fil}
            </p>
            
            <div className="h-[2px] w-full bg-gray-300 rounded my-5" />
            
            <p className="text-[38px] text-left text-gray-500 leading-tight">
                {service.description_en}
            </p>
        </div>
    );
}