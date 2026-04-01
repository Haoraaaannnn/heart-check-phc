export default function PrintHeader(){
    return(
        <div className="flex flex-col items-center justify-center bg-amber-300 w-full flex-shrink-0 py-2 sm:py-3 md:py-4 lg:py-6 portrait:lg:py-8 landscape:2xl:py-10 px-2 sm:px-3">
            <div className="flex flex-col item-center justify center gap-0.5 sm:gap-1 md:gap-2">
                <span className="font-baloo font-black text-center text-xl sm:text-3xl md:text-4xl lg:text-5xl portrait:lg:text-[60px] landscape:2xl:text-[60px] text-black">Maraming Salamat po!</span>
                <span className="text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl portrait:lg:text-[48px] landscape:2xl:text-[48px] text-black font-bold">Thank you!</span>
            </div>
        </div>
    );
}