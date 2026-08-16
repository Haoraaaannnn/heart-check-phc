import { Service } from "@/types/Services";

interface Props {
    service: Service;
}

export default function ConfirmationDescriptions({ service }: Props) {
    return (
        <div className="flex flex-col items-start w-full p-6 border-2 border-gray-200 rounded-2xl bg-white">
            <span 
                className="inline-block text-white text-xl font-extrabold px-5 py-2 rounded-xl mb-3 bg-[#7f0407]"
            >
                Ano ito? — What is this?
            </span>
            
            <p className="mt-1 text-2xl text-left text-gray-700 leading-snug font-black">
                {service.description_fil}
            </p>
            
            <div className="h-[2px] w-full bg-gray-200 rounded my-4" />
            
            <p className="text-xl text-left text-gray-500 leading-snug">
                {service.description_en}
            </p>
        </div>
    );
}