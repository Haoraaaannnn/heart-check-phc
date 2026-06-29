export default function PrintFooter(){
    return(
        <div className="flex flex-col items-center justify-center w-full flex-shrink-0 px-2 sm:px-3 md:px-4 lg:px-6 portrait:lg:px-8 landscape:2xl:px-10 py-2 sm:py-3 md:py-4 lg:py-5 portrait:lg:py-6 landscape:2xl:py-8">
            <div className="flex flex-col item-center justify center gap-0.5 sm:gap-1 md:gap-1.5">
                <span className="font-baloo font-black text-center text-xs sm:text-sm md:text-base lg:text-lg portrait:lg:text-[28px] landscape:2xl:text-[28px] text-black leading-tight">Ipiniprinta ang inyong numero. Maghintay na tawagin ito sa Rehistrasyon.</span>
                <span className="text-center text-xs sm:text-sm md:text-base lg:text-lg portrait:lg:text-[28px] landscape:2xl:text-[28px] text-black leading-tight">Your number is being printed. Wait for it to be called at Registration.</span>
            </div>
        </div>
    );
}