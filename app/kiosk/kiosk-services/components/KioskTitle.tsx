import Image from "next/image";
import Link from "next/link";

export default function KioskTitle({ isLandscape }: { isLandscape: boolean }) {
    return (
        <div className={isLandscape ? "flex h-full w-full flex-col items-center justify-center gap-4 px-4 lg:px-6" : "flex w-full flex-col items-center gap-6 px-4 lg:px-6"}>
            <div className="flex flex-col gap-4 lg:gap-6">
                <Link href="/kiosk/kiosk-new-old-selection" 
                className="bg-brand rounded-[16px] px-4 py-2 text-white text-[28px] absolute left-6 top-22 landscape:left-12 landscape:top-20 transition-all active:scale-95">
                    Bumalik - Back 
                </Link>
                <span className={isLandscape ? "text-center text-[50px] font-black text-gray-800 [-webkit-text-stroke:1px_currentColor]" : "text-[50px] font-black mt-20 my-18 text-gray-800 [-webkit-text-stroke:1px_currentColor]"}>
                    Heart Check <span className="text-brand-accent">PHC</span>
                </span>
            </div>
            <div className={isLandscape ? "relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[16px] aspect-[16/9]" : "relative mx-auto w-full overflow-hidden rounded-[16px] aspect-[16/9]"}>
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