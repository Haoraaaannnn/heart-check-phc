/**
 * @file queuePrintTicket.ts
 * @description Centralized visual styles for `QueuePrintContent` printed ticket display.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Number of milliseconds to display the ticket on screen before returning to entrance. */
export const QUEUE_PRINT_REDIRECT_DELAY_MS = 5000;

/** Inline styles for `QueuePrintContent`. */
export const QueuePrintTicketStyle = {
    ticketContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
        backgroundColor: themeColors.white,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        padding: "clamp(16px, 2.5vw, 32px)",
        maxWidth: 520,
        width: "100%",
    },
    serviceHeader: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    serviceTitle: {
        fontSize: "clamp(24px, 3.5vw, 36px)",
        fontWeight: 900,
        color: "#111827",
        lineHeight: 1.25,
    },
    badge: {
        width: "fit-content",
        backgroundColor: themeColors.brandRed,
        color: themeColors.white,
        fontWeight: 700,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        fontSize: "clamp(14px, 1.4vw, 18px)",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    },
    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#E5E7EB",
        marginTop: 4,
        marginBottom: 4,
    },
    queueWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingTop: 8,
        paddingBottom: 8,
    },
    queueLabel: {
        fontSize: "clamp(14px, 1.4vw, 16px)",
        fontWeight: 700,
        color: "#6B7280",
        marginBottom: 4,
    },
    queueNumber: {
        fontWeight: 900,
        fontSize: "clamp(48px, 7vw, 96px)",
        color: themeColors.brandRed,
        lineHeight: 1,
        letterSpacing: "-0.025em",
        marginTop: 12,
        marginBottom: 12,
    },
} satisfies Record<string, CSSProperties>;
