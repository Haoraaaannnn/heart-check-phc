"use client";

import { KioskTitleTexts } from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitleTexts";
import {
    KioskTitleStyle,
    KioskTitleClasses,
} from "@/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle";

/** Props for {@link KioskTitle}. */
interface KioskTitleProps {
    /** Optional landscape indicator for backward compatibility. */
    isLandscape?: boolean;
}

/**
 * Brand title and institutional PHC hospital identity header for the kiosk entrance screen.
 *
 * @remarks
 * Renders an institutional medical emblem, hospital eyebrow text,
 * the primary "Heart Check PHC" brand mark, and an OPD self-service badge.
 * Designed without photo images to guarantee fast rendering, high readability,
 * and zero layout shifts across any display resolution.
 *
 * @param props - Component props.
 * @returns The brand title header with institutional emblem.
 */
export default function KioskTitle({ isLandscape }: KioskTitleProps) {
    return (
        <div style={KioskTitleStyle.container}>
            {/* Hospital Identity Eyebrow */}
            <div style={KioskTitleStyle.eyebrowWrapper}>
                <span
                    className={KioskTitleClasses.eyebrow}
                    style={KioskTitleStyle.eyebrow}
                >
                    {KioskTitleTexts.hospitalFullHeader}
                </span>
            </div>

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
        </div>
    );
}