import Image from "next/image";

export default function KioskBanner(){
    return(
        <div className="relative z-10 mx-8 mt-8 landscape:mt-4 landscape:mx-4 bg-gradient-to-br from-[#DE1717] to-[#FF7F7F] rounded-[16px] px-6 landscape:px-4 py-4 landscape:py-2 overflow-hidden shadow-[0_4px_30px_5px_#CF000080]">
            <div className="absolute -top-20 -right-10 w-80 h-80 landscape:w-40 landscape:h-40 rounded-full bg-[#FF7373] opacity-75 -z-10"/>
            <div className="absolute right-10 landscape:right-4 bottom-1 landscape:bottom-0.5 animate-[heartbeat_1.6s_ease-in-out_infinite]">
            <Image
            src="/kiosk-assets/heart.svg"
            alt="Heart"
            width={100}
            height={100}
            className="drop-shadow-lg scale-500 landscape:scale-300"
            />
            </div>

            <div className="pr-28 landscape:pr-16">
                <div className="flex items-center gap-10 landscape:gap-6 mb-0.5 landscape:mb-0 ml-10 landscape:ml-4">
                <div className="animate-[wave_1.8s_ease-in-out_infinite]">
                    <Image
                    src="/kiosk-assets/wave.svg"
                    alt="Waving "
                    width={40}
                    height={40}
                    className="drop-shadow-lg scale-300 landscape:scale-200"
                    />
                </div>
                <p className="font-baloo font-black text-[70px] landscape:text-[40px] text-white drop-shadow-sm">Magandang Araw!</p>
            </div>
            <p className="text-[#FFE600] font-baloo font-black text-[50px] landscape:text-[28px] drop-shadow-sm">Welcome to Heart Check PHC!</p>
            <p className="text-white font-baloo font-black text-[40px] landscape:text-[24px] mt-2 landscape:mt-1 whitespace-nowrap">Pumili at pindutin ang serbisyong kailangan ninyo:</p>
            </div>
            <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: translateY(-50%) scale(1); }
          14%       { transform: translateY(-50%) scale(1.12); }
          28%       { transform: translateY(-50%) scale(1); }
          42%       { transform: translateY(-50%) scale(1.07); }
          56%       { transform: translateY(-50%) scale(1); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-15deg); }
          40%       { transform: rotate(12deg); }
          60%       { transform: rotate(-10deg); }
          80%       { transform: rotate(8deg); }
        }
      `}</style>
        </div>       
    );
}