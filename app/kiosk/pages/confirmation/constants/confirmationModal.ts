/**
 * @file confirmationModal.ts
 * @description Centralized visual styles and Tailwind utility classes for `ConfirmationModal`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for confirmation modal, referencing centralized root typography scale. */
export const confirmationModalTypography = {
    modalTitleSize: kioskTypography.modalTitle,
    modalBadgeSize: kioskTypography.modalBadge,
} as const;

/** Colors for confirmation modal. */
export const confirmationModalColors = {
    brandRed: themeColors.brandRed,
    white: themeColors.white,
    modalOverlay: "rgba(0, 0, 0, 0.6)",
    pillBg: "rgba(255, 255, 255, 0.2)",
    pillBorder: "rgba(255, 255, 255, 0.35)",
} as const;

/** Inline styles for `ConfirmationModal`. */
export const ConfirmationModalStyle = {
    icon: {
        fontSize: 56,
        lineHeight: 1,
    },
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: confirmationModalColors.modalOverlay,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 16,
    },
    modalBox: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 900,
        maxHeight: "92vh",
        overflowY: "auto",
        backgroundColor: confirmationModalColors.white,
        borderRadius: 24,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    },
    modalHeader: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingLeft: 28,
        paddingRight: 28,
        paddingTop: 22,
        paddingBottom: 22,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        color: confirmationModalColors.white,
        backgroundColor: confirmationModalColors.brandRed,
        flexShrink: 0,
    },
    modalTitle: {
        fontWeight: 900,
        fontSize: confirmationModalTypography.modalTitleSize,
        lineHeight: 1.2,
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
    modalBadge: {
        width: "fit-content",
        display: "inline-block",
        backgroundColor: confirmationModalColors.pillBg,
        border: `1px solid ${confirmationModalColors.pillBorder}`,
        color: confirmationModalColors.white,
        fontSize: confirmationModalTypography.modalBadgeSize,
        fontWeight: 700,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 9999,
        marginTop: 4,
    },
    modalBody: {
        paddingLeft: 28,
        paddingRight: 28,
        paddingTop: 24,
        paddingBottom: 24,
    },
    modalFooter: {
        paddingLeft: 28,
        paddingRight: 28,
        paddingBottom: 28,
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `ConfirmationModal`. */
export const ConfirmationModalClasses = {
    overlay: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200",
    scroll: "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    icon: "size-12 sm:size-14 shrink-0",
    headerText: "flex flex-col min-w-0",
    continueBtn: "transition-all duration-150 active:scale-95 active:brightness-95 shadow-md",
    cancelBtn: "transition-all duration-150 active:scale-95 active:bg-gray-100",
} as const;
