"use client";

import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import {
    KioskBackButtonClasses,
    KioskBackButtonStyles,
} from "@/app/kiosk/constants/kioskBackButton";
import { KioskBackButtonTexts } from "@/app/kiosk/constants/kioskBackButtonTexts";

/** Props for {@link KioskBackButton}. */
interface KioskBackButtonProps {
    /** Target URL route to navigate back to. */
    href: string;
    /** Optional custom button label (defaults to {@link KioskBackButtonTexts.label}). */
    label?: string;
}

/**
 * Universal back button for kiosk workflow screens.
 *
 * @remarks
 * Rendered with elevated z-index in `app/kiosk/layout.tsx` for permitted
 * sub-screens, providing prominent tactile touch navigation for patients.
 *
 * @param props - Component props.
 * @returns The fixed-position kiosk back button.
 */
export default function KioskBackButton({
    href,
    label = KioskBackButtonTexts.label,
}: KioskBackButtonProps) {
    return (
        <Link
            href={href}
            aria-label={KioskBackButtonTexts.ariaLabel}
            className={KioskBackButtonClasses.button}
            style={KioskBackButtonStyles.button}
        >
            <IconArrowLeft size={28} stroke={2} />
            <span>{label}</span>
        </Link>
    );
}