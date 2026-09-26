/**
 * @file confirmationActions.ts
 * @description Centralized visual styles and Tailwind utility classes for `ConfirmationActions`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Typography tokens for action buttons. */
export const confirmationActionsTypography = {
    btnTextSize: "clamp(18px, 1.8vw, 24px)",
} as const;

/** Inline styles for `ConfirmationActions`. */
export const ConfirmationActionsStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginTop: 8,
    },
    continueBtn: {
        flex: 1,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: themeColors.brandRed,
        color: themeColors.white,
        fontSize: confirmationActionsTypography.btnTextSize,
        fontWeight: 900,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 16,
        cursor: "pointer",
        border: "none",
    },
    cancelBtn: {
        flex: 1,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: themeColors.white,
        color: "#374151",
        border: "2px solid #D1D5DB",
        fontSize: confirmationActionsTypography.btnTextSize,
        fontWeight: 700,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 16,
        cursor: "pointer",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `ConfirmationActions`. */
export const ConfirmationActionsClasses = {
    continueBtn: "transition-all duration-150 active:scale-95 hover:brightness-105 shadow-md",
    cancelBtn: "transition-all duration-150 active:scale-95 hover:bg-gray-100 shadow-sm",
} as const;
