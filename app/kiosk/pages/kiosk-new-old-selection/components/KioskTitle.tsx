"use client";

import Image from "next/image";
import { KioskTitleTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitleTexts";
import {
    KioskTitleStyle,
    KioskTitleClasses,
} from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle";

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
                    className={KioskTitleClasses.titleStroke}
                >
                    {KioskTitleTexts.titleMain}{" "}
                    <span style={KioskTitleStyle.titleAccent}>
                        {KioskTitleTexts.titleAccent}
                    </span>
                </span>
            </div>

            {/* Hospital Building Illustration */}
            <div className={KioskTitleClasses.titleImageWrapper(isLandscape)}>
                <Image
                    src="/images/PHC.jpg"
                    alt={KioskTitleTexts.imageAlt}
                    fill
                    className={KioskTitleClasses.titleImage}
                    priority
                />
            </div>
        </div>
    );
}