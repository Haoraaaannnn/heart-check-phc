"use client";

import { Service } from "@/types/Services";

interface PhoneInputProps { 
  phone: string; 
  onDelete: () => void; 
  service: Service 
}

export default function PhoneInput({ phone, onDelete, service }: PhoneInputProps) {
  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  };

  return (
    <div className="w-full flex items-center bg-white px-[2vw] border-[0.3vh] border-gray-100 shadow-[inset_0_0.4vh_1vh_rgba(0,0,0,0.05)] h-[8.5vh] min-h-[65px] max-h-[130px] rounded-[2vh]">
      <div className="flex-1 font-bold tracking-widest text-black text-[min(4.5vh,50px)] whitespace-nowrap overflow-hidden">
        {phone.length > 0 ? formatPhone(phone) : <span className="text-gray-300 font-normal">0912 345 6780</span>}
      </div>
      <button 
        onClick={onDelete} 
        className="h-[75%] px-[3vh] min-w-[80px] flex items-center justify-center text-white active:scale-95 shadow-md text-[min(4vh,40px)] rounded-[1.5vh]" 
        style={{background: service.bg_color}}
      >
        ⌫
      </button>
    </div>
  );
}