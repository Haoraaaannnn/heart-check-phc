export default function KioskBanner(){
    return(
        <div className="relative z-10 mt-4 px-6 py-2 landscape:mt-2 landscape:mx-4 landscape:px-4 landscape:py-2">
            <div className="text-center landscape:text-center landscape:mt-12">
                <p className="text-black font-black text-[40px] landscape:text-[28px]">Magandang Araw! Welcome to Heart Check PHC!</p>
                <p className="text-black font-normal text-[30px] landscape:text-[24px] whitespace-nowrap">Pumili at pindutin ang serbisyong kailangan ninyo:</p>
            </div>
        </div>
    );
}