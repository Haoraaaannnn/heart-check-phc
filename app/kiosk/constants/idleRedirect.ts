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
    /** Fixed overlay positioning for the floating tap-to-start identifier. */
    tapPromptContainer: {
        position: "fixed",
        bottom: "clamp(36px, 6vh, 72px)",
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 102,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    /** Tactile pill surface with solid contrast, red border, and elevation shadow. */
    tapPromptBadge: {
        display: "flex",
        alignItems: "center",
        gap: "clamp(12px, 1.6vw, 20px)",
        backgroundColor: themeColors.white,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: themeColors.brandRed,
        borderRadius: "9999px",
        paddingTop: "clamp(12px, 1.5vh, 18px)",
        paddingBottom: "clamp(12px, 1.5vh, 18px)",
        paddingLeft: "clamp(20px, 2.5vw, 32px)",
        paddingRight: "clamp(24px, 3vw, 36px)",
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.45)",
        userSelect: "none",
    },
    /** Circular accent icon badge in light red with brand red icon fill. */
    tapIconContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "clamp(44px, 5.5vmin, 58px)",
        height: "clamp(44px, 5.5vmin, 58px)",
        borderRadius: "9999px",
        backgroundColor: "#FEE2E2",
        color: themeColors.brandRed,
        flexShrink: 0,
    },
    /** Sizing token for the tap icon. */
    tapIcon: {
        fontSize: "clamp(26px, 3.2vmin, 36px)",
        lineHeight: 1,
    },
    /** Vertical text container for primary title and bilingual subtitle. */
    tapTextColumn: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        textAlign: "left",
    },
    /** Bold primary identifier text. */
    tapTitle: {
        fontSize: kioskTypography.bannerTitle,
        fontWeight: 800,
        color: themeColors.black,
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
    },
    /** Filipino bilingual subtitle guidance. */
    tapSubtitle: {
        fontSize: kioskTypography.instructionSecondary,
        fontWeight: 500,
        color: "#4B5563",
        lineHeight: 1.25,
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
     * Boxicons icon class for the tap pointer.
     */
    tapIcon: "bx bx-pointer",
} as const;