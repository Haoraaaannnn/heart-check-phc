"use client";

import Image from "next/image";
import { kioskNewOldTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldTexts";
import { KioskTitleStyle } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOld";

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
        <div style={KioskTitleStyle.container}>
            {/* Main Brand Title */}
            <div style={KioskTitleStyle.titleWrapper}>
                <span
                    style={KioskTitleStyle.title}
                    className="[-webkit-text-stroke:1px_currentColor]"
                >
                    {kioskNewOldTexts.titleMain}{" "}
                    <span style={KioskTitleStyle.titleAccent}>
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