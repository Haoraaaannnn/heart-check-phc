/**
 * @file idleRedirect.ts
 * @description Image, layout, and presentation settings for the kiosk inactivity slideshow.
 *
 * @remarks
 * The slideshow reuses the numbered images stored in `public/images`; no
 * image files are copied or modified by the idle flow.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Existing public image paths displayed by the kiosk idle slideshow. */
export const IDLE_SLIDESHOW_IMAGES = [
    "/images/1.jpg",
    "/images/2.jpg",
    "/images/3.jpg",
] as const;

/** Inline presentation styles for the full-screen slideshow control and tap prompt. */
export const IdleRedirectStyle = {
    /** Full-screen interactive activation button covering the entire viewport. */
    slideshowButton: {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        padding: 0,
        border: 0,
        backgroundColor: "#000",
        cursor: "pointer",
        zIndex: 100,
    },
    /** Full-width fixed bottom overlay with ultra-smooth eased dark upward fade gradient for the tap prompt. */
    tapPromptContainer: {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        minHeight: "clamp(120px, 16vh, 160px)",
        background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.81) 8%, rgba(0, 0, 0, 0.73) 16%, rgba(0, 0, 0, 0.62) 25%, rgba(0, 0, 0, 0.50) 35%, rgba(0, 0, 0, 0.37) 46%, rgba(0, 0, 0, 0.25) 58%, rgba(0, 0, 0, 0.15) 70%, rgba(0, 0, 0, 0.07) 82%, rgba(0, 0, 0, 0.02) 92%, rgba(0, 0, 0, 0) 100%)",
        pointerEvents: "none",
        zIndex: 102,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: "clamp(18px, 2.6vh, 30px)",
        paddingLeft: "16px",
        paddingRight: "16px",
    },
    /** Bare banner layout without card background, sitting directly on the bottom fade. */
    tapPromptBadge: {
        display: "flex",
        alignItems: "center",
        gap: "clamp(12px, 1.5vw, 20px)",
        userSelect: "none",
    },
    /** Bare accent icon container with white icon fill. */
    tapIconContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: themeColors.white,
        flexShrink: 0,
    },
    /** Sizing token for the kiosk touch hand icon. */
    tapIcon: {
        fontSize: "clamp(30px, 3.8vmin, 44px)",
        lineHeight: 1,
        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))",
    },
    /** Vertical text container for primary title and bilingual subtitle. */
    tapTextColumn: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        textAlign: "left",
    },
    /** Bold primary identifier text rendered in white with subtle shadow for dark gradient contrast. */
    tapTitle: {
        fontSize: kioskTypography.bannerTitle,
        fontWeight: 800,
        color: themeColors.white,
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
        textShadow: "0 2px 6px rgba(0, 0, 0, 0.7)",
    },
    /** Filipino bilingual subtitle guidance in crisp light text. */
    tapSubtitle: {
        fontSize: kioskTypography.instructionSecondary,
        fontWeight: 500,
        color: "rgba(255, 255, 255, 0.85)",
        lineHeight: 1.25,
        textShadow: "0 1px 4px rgba(0, 0, 0, 0.6)",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind classes for slideshow image visibility, transitions, and tap prompt badge. */
export const IdleRedirectClasses = {
    /**
     * Returns cover-fit and cross-fade classes for one slideshow image.
     *
     * @param isActive - Whether the image is the currently selected slide.
     * @returns Image classes with the appropriate opacity state.
     */
    image: (isActive: boolean): string =>
        `object-cover transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-0"}`,

    /**
     * Subtle pulse animation for the tap prompt badge.
     */
    tapPromptBadge: "animate-pulse select-none",

    /**
     * Boxicons icon class for the touchscreen tap hand gesture.
     */
    tapIcon: "bx bxs-hand-up",
} as const;