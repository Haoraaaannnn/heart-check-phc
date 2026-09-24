"use client";

import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { themeColors } from "@/constants/colors";

/** Props for {@link KioskBackButton}. */
interface KioskBackButtonProps {
    /** Target URL route to navigate back to. */
    href: string;
    /** Optional custom button label (defaults to "Bumalik - Back"). */
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
    label = "Bumalik - Back",
}: KioskBackButtonProps) {
    return (
        <Link
            href={href}
            className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xl sm:text-2xl font-bold text-white shadow-md transition-all duration-150 active:scale-95 hover:brightness-105"
            style={{ backgroundColor: themeColors.brandRed }}
        >
            <IconArrowLeft size={28} stroke={2} />
            <span>{label}</span>
        </Link>
    );
}