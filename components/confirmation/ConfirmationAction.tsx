import Link from "next/link";
import { Service } from "@/types/Services";

interface Props {
  serviceId: number;
  serviceColor: string;
}

export default function ConfirmationActions({ serviceId, serviceColor }: Props) {
  return (
    <div className="flex flex-col justify-center px-8 w-full mt-4 mb-6 gap-4">
      <Link
        href={`/kiosk/sms-input?serviceId=${serviceId}`}
        className="w-full py-[15px] text-white text-center text-[55px] font-baloo font-black rounded-[45px] transition-all active:scale-95 shadow-md"
        style={{background: serviceColor}}
      >
        Magpatuloy - Continue
      </Link>
      
      <Link
        href="/kiosk/kiosk-services"
        className="w-full py-[15px] border-gray-400 border-[5px] text-center rounded-[45px] font-baloo font-black text-gray-500 text-[50px] transition-all active:scale-95 bg-white"
      >
        Bumalik - Cancel
      </Link>
    </div>
  );
}