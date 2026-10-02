/**
 * @file confirmationActions.ts
 * @description Centralized visual styles and Tailwind utility classes for `ConfirmationActions`.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Typography tokens for action buttons, referencing centralized root typography scale. */
export const confirmationActionsTypography = {
    btnTextSize: kioskTypography.buttonText,
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
        minHeight: "clamp(54px, 6.5vh, 66px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: themeColors.brandRed,
        color: themeColors.white,
        fontSize: confirmationActionsTypography.btnTextSize,
        fontWeight: 900,
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(14px, 1.8vh, 20px)",
        paddingBottom: "clamp(14px, 1.8vh, 20px)",
        borderRadius: 16,
        cursor: "pointer",
        border: "none",
        textAlign: "center",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
    cancelBtn: {
        flex: 1,
        width: "100%",
        minHeight: "clamp(54px, 6.5vh, 66px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: themeColors.white,
        color: "#374151",
        border: "2px solid #D1D5DB",
        fontSize: confirmationActionsTypography.btnTextSize,
        fontWeight: 700,
        paddingLeft: "clamp(14px, 2vw, 24px)",
        paddingRight: "clamp(14px, 2vw, 24px)",
        paddingTop: "clamp(14px, 1.8vh, 20px)",
        paddingBottom: "clamp(14px, 1.8vh, 20px)",
        borderRadius: 16,
        cursor: "pointer",
        textAlign: "center",
        overflowWrap: "break-word",
        wordBreak: "break-word",
    },
} satisfies Record<string, CSSProperties>;

/** Tailwind utility classes for `ConfirmationActions`. */
export const ConfirmationActionsClasses = {
    continueBtn: "transition-all duration-150 active:scale-95 active:brightness-95 shadow-md",
    cancelBtn: "transition-all duration-150 active:scale-95 active:bg-gray-100 shadow-sm",
} as const;
