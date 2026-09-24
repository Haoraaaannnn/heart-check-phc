"use client";

import Image from "next/image";
import { kioskNewOldTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldTexts";
import { kioskNewOldTypography } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOld";
import { themeColors } from "@/constants/colors";

/** Props for {@link KioskTitle}. */
interface KioskTitleProps {
    /** Whether the screen is currently in landscape orientation. */
    isLandscape: boolean;
}

/**
 * Brand title header and PHC hospital illustration for the kiosk entrance screen.
 *
 * @remarks
 * In landscape orientation, this component occupies the left 45% column.
 * In portrait orientation, it stacks vertically above the welcome banner and cards.
 *
 * @param props - Component props.
 * @returns The brand title header with hospital hero image.
 */
export default function KioskTitle({ isLandscape }: KioskTitleProps) {
    return (
        <div className="flex w-full flex-col items-center justify-center gap-6 md:gap-8">
            {/* Main Brand Title */}
            <div className="text-center">
                <span
                    className="font-black text-gray-800 [-webkit-text-stroke:1px_currentColor]"
                    style={{ fontSize: kioskNewOldTypography.titleSize }}
                >
                    {kioskNewOldTexts.titleMain}{" "}
                    <span style={{ color: themeColors.brandRed }}>
                        {kioskNewOldTexts.titleAccent}
                    </span>
                </span>
            </div>

            {/* Hospital Building Illustration */}
            <div
                className={`relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm ${
                    isLandscape ? "max-w-[760px]" : "max-w-[900px]"
                }`}
            >
                <Image
                    src="/images/PHC.jpg"
                    alt={kioskNewOldTexts.imageAlt}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
    );
}