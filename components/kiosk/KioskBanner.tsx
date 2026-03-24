import Image from "next/image";

export default function KioskBanner(){
    return(
        <div className="relative z-10 mx-8 mt-8 bg-gradient-to-br from-[#DE1717] to-[#FF7F7F] rounded-[45px] px-6 py-4 overflow-hidden shadow-[0_4px_30px_5px_#CF000080]">
            <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-[#FF7373] opacity-75 -z-10"/>
            <div className="absolute right-10 bottom-1 animate-[heartbeat_1.6s_ease-in-out_infinite]">
            <Image
            src="/kiosk-assets/heart.svg"
            alt="Heart"
            width={100}
            height={100}
            className="drop-shadow-lg scale-500"
            />
            </div>

            <div className="pr-28">
                <div className="flex items-center gap-10 mb-0.5 ml-10">
                <div className="animate-[wave_1.8s_ease-in-out_infinite]">
                    <Image
                    src="/kiosk-assets/wave.svg"
                    alt="Waving "
                    width={40}
                    height={40}
                    className="drop-shadow-lg scale-300"
                    />
                </div>
                <p className="font-baloo font-black text-[70px] text-white drop-shadow-sm">Magandang Araw!</p>
            </div>
            <p className="text-[#FFE600] font-baloo font-black text-[50px] drop-shadow-sm">Welcome to Heart Check PHC!</p>
            <p className="text-white font-baloo font-black text-[40px] mt-2 whitespace-nowrap">Pumili at pindutin ang serbisyong kailangan ninyo:</p>
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