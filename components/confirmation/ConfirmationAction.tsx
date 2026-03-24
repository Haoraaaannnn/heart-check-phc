import Link from "next/link";
import { Service } from "@/types/Services";

interface Props {
  serviceId: number;
  serviceColor: string;
}

export default function ConfirmationActions({ serviceId, serviceColor }: Props) {
  return (
    <div className="flex flex-col justify-center mb-8">
      <Link
        href={`/kiosk/sms-input?serviceId=${serviceId}`}
        className="mx-8 my-3 max-w-full py-[18px] px-[18px] bg-red-600 text-white text-center text-[60px] font-baloo font-black rounded-[45px] transition-all active:scale-90 shadow-xl"
        style={{background: serviceColor}}>
        Magpatuloy - Continue
      </Link>
      <Link
        href="/kiosk/kiosk-services"
        className="mx-8 my-3 max-w-full py-[18px] px-[18px] border-gray-400 border-[4px] text-center rounded-[45px] text-gray-800 text-[50px] transition-all active:scale-90"
      >
        Bumalik - Cancel
      </Link>
    </div>
  );
}