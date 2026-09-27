/**
 * @file smsInstruction.ts
 * @description Centralized visual styles for the SMS instruction panel.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Inline styles for `SMSInstruction`. */
export const SMSInstructionStyle = {
    container: {
        width: "100%",
        textAlign: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
        backgroundColor: themeColors.white,
        borderRadius: 16,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    instructionFil: {
        fontWeight: 900,
        fontSize: "clamp(20px, 2.2vw, 30px)",
        color: "#111827",
        lineHeight: 1.25,
        margin: 0,
    },
    divider: {
        height: 1,
        width: "100%",
        backgroundColor: "#E5E7EB",
        borderRadius: 9999,
        marginTop: 10,
        marginBottom: 10,
    },
    instructionEn: {
        marginTop: 6,
        fontWeight: 700,
        fontSize: "clamp(15px, 1.5vw, 20px)",
        color: "#4B5563",
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;
