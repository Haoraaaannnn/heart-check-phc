import Link from "next/link";

interface Props {
  serviceId: number;
}

export default function ConfirmationActions({ serviceId }: Props) {
  return (
    <div className="flex flex-col justify-center">
      <Link
        href={`/kiosk/sms-input?serviceId=${serviceId}`}
        className="mx-8 my-3 max-w-full py-[18px] px-[18px] bg-red-600 text-white text-center text-[60px] font-baloo font-black rounded-[45px] transition-all active:scale-90 shadow-xl"
      >
        Magpatuloy - Continue
      </Link>
      <Link
        href="/kiosk/kiosk-services"
        className="mx-8 my-3 max-w-full py-[18px] px-[18px] border-gray-600 text-center rounded-[45px] bg-gray-500 text-gray-800 text-[50px] transition-all active:scale-90"
      >
        Bumalik - Cancel
      </Link>
    </div>
  );
}