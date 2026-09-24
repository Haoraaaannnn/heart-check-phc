import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

// Re-export text copy for backward compatibility
export { queuePrintTexts } from "./queuePrintTexts";

/** Number of milliseconds to display the ticket on screen before returning to entrance. */
export const QUEUE_PRINT_REDIRECT_DELAY_MS = 5000;

/** Theme styling for queue print elements. */
export const queuePrintTheme = {
    badgeBg: themeColors.brandRed,
    brandRed: themeColors.brandRed,
    white: themeColors.white,
    darkText: "#111827",
    subtitleText: "#374151",
    footerEnText: "#4B5563",
    borderColor: "#E5E7EB",
};

/** Inline styles for `PrintHeader`. */
export const PrintHeaderStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        flexShrink: 0,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: "clamp(12px, 2vh, 16px)",
        paddingBottom: "clamp(12px, 2vh, 16px)",
        textAlign: "center",
    },
    title: {
        fontWeight: 900,
        fontSize: "clamp(24px, 3.2vw, 44px)",
        color: queuePrintTheme.darkText,
        lineHeight: 1.2,
        margin: 0,
    },
    subtitle: {
        marginTop: 4,
        fontSize: "clamp(18px, 2.2vw, 28px)",
        color: queuePrintTheme.subtitleText,
        fontWeight: 700,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `PrintFooter`. */
export const PrintFooterStyle = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        flexShrink: 0,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: "clamp(12px, 2vh, 16px)",
        paddingBottom: "clamp(12px, 2vh, 16px)",
        textAlign: "center",
    },
    noticeFil: {
        fontWeight: 900,
        fontSize: "clamp(14px, 1.4vw, 20px)",
        color: queuePrintTheme.darkText,
        lineHeight: 1.25,
        margin: 0,
    },
    noticeEn: {
        marginTop: 4,
        fontSize: "clamp(12px, 1.2vw, 16px)",
        color: queuePrintTheme.footerEnText,
        fontWeight: 700,
        lineHeight: 1.25,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/** Inline styles for `QueuePrintContent`. */
export const QueuePrintTicketStyle = {
    ticketContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: queuePrintTheme.white,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: queuePrintTheme.borderColor,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        padding: "clamp(16px, 2.5vw, 32px)",
        maxWidth: 520,
        width: "100%",
    },
    badge: {
        width: "fit-content",
        backgroundColor: queuePrintTheme.badgeBg,
        color: queuePrintTheme.white,
        fontWeight: 700,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 9999,
        fontSize: "clamp(14px, 1.4vw, 18px)",
    },
    queueNumber: {
        fontWeight: 900,
        fontSize: "clamp(48px, 7vw, 96px)",
        color: queuePrintTheme.brandRed,
        lineHeight: 1,
        letterSpacing: "-0.025em",
        marginTop: 12,
        marginBottom: 12,
    },
} satisfies Record<string, CSSProperties>;
