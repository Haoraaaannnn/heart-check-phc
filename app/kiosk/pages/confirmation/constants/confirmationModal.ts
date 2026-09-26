/**
 * @file confirmationModal.ts
 * @description Centralized visual styles and Tailwind utility classes for `ConfirmationModal`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Typography tokens for confirmation modal. */
export const confirmationModalTypography = {
    modalTitleSize: "clamp(20px, 2.2vw, 24px)",
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
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: confirmationModalColors.modalOverlay,
        backdropFilter: "blur(4px)",
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
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    modalBadge: {
        width: "fit-content",
        display: "inline-block",
        backgroundColor: confirmationModalColors.pillBg,
        border: `1px solid ${confirmationModalColors.pillBorder}`,
        color: confirmationModalColors.white,
        fontSize: 13,
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
    overlay: "animate-in fade-in duration-200",
    scroll: "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    icon: "size-12 sm:size-14 shrink-0",
    headerText: "flex flex-col min-w-0",
    continueBtn: "transition-all duration-150 active:scale-95 shadow-md hover:brightness-105",
    cancelBtn: "transition-all duration-150 active:scale-95 hover:bg-gray-50",
} as const;
