import { Service } from "@/types/Services";

interface Props{
    service: Service
}

export default function ConfirmationDescriptions({service}: Props){
    return(
        <div>
        <p className="mt-4 text-5xl text-center text-gray-700 leading-relaxed">
        {service.description_fil}
        </p>
        <p className="mt-6 text-center text-sm text-gray-500">
        {service.description_en}
        </p>
        </div>
    );
}