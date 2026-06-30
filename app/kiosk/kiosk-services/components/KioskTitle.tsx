import Image from "next/image";

export default function KioskTitle() {
    return (
        <div className="flex w-full flex-col items-center gap-6px-4 lg:px-6">
            <div className="flex flex-col gap-4 lg:gap-6">
                {/* <h1 className="text-center text-[42px] font-bold text-[#7f0407] lg:text-[48px] mt-20 my-18">
                    Heart Check PHC
                </h1> */}
                <span className="text-[50px] font-black mt-20 my-18 text-gray-800 [-webkit-text-stroke:1px_currentColor]">
                    Heart Check <span className="text-[#cc3535]">PHC</span>
                </span>
            </div>
            <div className="relative mx-auto w-full overflow-hidden rounded-[16px] aspect-[16/9]">
                <Image
                    src="/images/PHC.jpg"
                    alt="Heart Check PHC illustration"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
    );
}