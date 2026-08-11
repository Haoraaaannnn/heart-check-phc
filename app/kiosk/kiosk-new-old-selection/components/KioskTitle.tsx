"use client";

import Image from "next/image";

export default function KioskTitle({
    isLandscape,
}: {
    isLandscape: boolean;
}) {
    return (
        <div
            className={
                isLandscape
                    ? "flex w-full flex-col items-center justify-center gap-8"
                    : "flex w-full flex-col items-center justify-center gap-8"
            }
        >
            {/* TITLE */}
            <div className="text-center">
                <span className="text-[50px] font-black text-gray-800 [-webkit-text-stroke:1px_currentColor]">
                    Heart Check{" "}
                    <span className="text-[#cc3535]">
                        PHC
                    </span>
                </span>
            </div>

            {/* IMAGE */}
            <div
                className={
                    isLandscape
                        ? "relative mx-auto aspect-[16/9] w-full max-w-[760px] overflow-hidden rounded-[16px]"
                        : "relative mx-auto aspect-[16/9] w-full max-w-[900px] overflow-hidden rounded-[16px]"
                }
            >
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