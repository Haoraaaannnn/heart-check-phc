"use client";

import { Service } from "@/types/Services";

interface Props {
  phone: string;
  onDelete: () => void;
  service: Service
}

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
};

export default function PhoneInput({ phone, onDelete, service }: Props) {
  return (
    // Height and Rounding
    <div className="w-full flex items-center bg-white px-3 md:px-4 py-2 gap-2 md:gap-3 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]
      h-[70px] md:h-[100px] portrait:lg:h-[130px] landscape:2xl:h-[130px]
      rounded-[20px] md:rounded-[30px] portrait:lg:rounded-[45px] landscape:2xl:rounded-[45px]
    ">
      
      {/* THE FIX: Text size explicitly checks for portrait Kiosk OR landscape Kiosk */}
      <div className="flex-1 min-w-0 font-semibold tracking-widest text-black flex items-center whitespace-nowrap overflow-hidden px-2 md:px-4
        text-2xl md:text-4xl portrait:lg:text-[70px] landscape:lg:text-4xl landscape:2xl:text-[70px]
      ">
        {phone.length > 0 ? (
          formatPhone(phone)
        ) : (
          <span className="text-gray-300">0912 345 6780</span>
        )}
      </div>

      {/* Button scaling */}
      <button
        onClick={onDelete}
        className="h-full shrink-0 flex items-center justify-center text-white active:scale-95 shadow-lg md:shadow-2xl
          aspect-square md:aspect-auto 
          w-[80px] md:w-[100px] portrait:lg:w-[150px] landscape:2xl:w-[150px]
          text-2xl md:text-5xl portrait:lg:text-[70px] landscape:lg:text-5xl landscape:2xl:text-[70px]
          rounded-[15px] md:rounded-[25px] portrait:lg:rounded-[45px] landscape:2xl:rounded-[45px]
        "
        style={{background: service.bg_color}}>
        ⌫
      </button>
      
    </div>
  );
}