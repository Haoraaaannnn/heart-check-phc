/**
 * @file queuePrintTicket.ts
 * @description Centralized visual styles for `QueuePrintContent` printed ticket display.
 *
 * Defines typography tokens and CSS properties for the on-screen physical ticket
 * preview, including document type badge, service identifiers, Manila timestamp,
 * destination cubicle, highlighted queue number, and bilingual patient guidance.
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";
import { kioskTypography } from "@/constants/kiosk";

/** Number of milliseconds to display the ticket on screen before returning to entrance. */
export const QUEUE_PRINT_REDIRECT_DELAY_MS = 5000;

/** Typography tokens for printed ticket card, enlarged for elderly patient accessibility. */
export const QueuePrintTicketTypography = {
    /** Primary Filipino service title typography scale. */
    serviceTitleSize: "clamp(24px, 3vw, 34px)",
    /** Secondary English service title typography scale (no pillbox). */
    serviceSubtitleSize: "clamp(18px, 2vw, 22px)",
    /** English primary queue callout label text scale. */
    queueLabelSize: "clamp(18px, 2vw, 22px)",
    /** Filipino secondary queue subtitle text scale. */
    queueLabelFilSize: "clamp(15px, 1.6vw, 18px)",
    /** Main highlighted queue ticket number font scale for maximum readability. */
    queueNumberSize: "clamp(68px, 8.5vw, 92px)",
    /** Destination cubicle label font scale. */
    cubicleLabelSize: "clamp(17px, 1.8vw, 20px)",
    /** Destination cubicle value font scale. */
    cubicleValueSize: "clamp(18px, 2vw, 22px)",
    /** Destination location label font scale (legacy alias for cubicleLabelSize). */
    locationLabelSize: "clamp(17px, 1.8vw, 20px)",
    /** Destination location value font scale (legacy alias for cubicleValueSize). */
    locationValueSize: "clamp(18px, 2vw, 22px)",
    /** Timestamp text font scale. */
    metaDateSize: "clamp(15px, 1.6vw, 18px)",
} as const;

/** Inline styles for `QueuePrintContent`. */
export const QueuePrintTicketStyle = {
    /** Outermost card container representing the physical queue ticket. */
    ticketContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "clamp(8px, 1.2vh, 14px)",
        backgroundColor: themeColors.white,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E5E7EB",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        paddingTop: "clamp(14px, 2vh, 22px)",
        paddingBottom: "clamp(14px, 2vh, 22px)",
        paddingLeft: "clamp(24px, 3.5vw, 44px)",
        paddingRight: "clamp(24px, 3.5vw, 44px)",
        maxWidth: 520,
        width: "100%",
        boxSizing: "border-box",
        flexShrink: 0,
        margin: "0 auto",
    },
    /** Header section wrapping service title and English subtitle. */
    serviceHeader: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        width: "100%",
        flexShrink: 0,
    },
    /** Filipino service name heading. */
    serviceTitle: {
        fontSize: QueuePrintTicketTypography.serviceTitleSize,
        fontWeight: 900,
        color: "#111827",
        lineHeight: 1.2,
        margin: 0,
    },
    /** English service name subtitle (clean text, no pillbox). */
    serviceSubtitle: {
        fontSize: QueuePrintTicketTypography.serviceSubtitleSize,
        fontWeight: 700,
        color: themeColors.brandRed,
        lineHeight: 1.25,
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    /** Full-width subtle horizontal divider. */
    divider: {
        width: "100%",
        height: 2,
        backgroundColor: "#E5E7EB",
        marginTop: 2,
        marginBottom: 2,
        flexShrink: 0,
    },
    /** Wrapper highlighting the patient's queue number. */
    queueWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingTop: 4,
        paddingBottom: 4,
        flexShrink: 0,
    },
    /** English queue label above the number. */
    queueLabel: {
        fontSize: QueuePrintTicketTypography.queueLabelSize,
        fontWeight: 700,
        color: "#4B5563",
        lineHeight: 1.25,
        margin: 0,
    },
    /** Filipino secondary queue subtitle. */
    queueLabelFil: {
        fontSize: QueuePrintTicketTypography.queueLabelFilSize,
        fontWeight: 600,
        color: "#6B7280",
        lineHeight: 1.2,
        marginTop: 2,
        marginBottom: 0,
    },
    /** Prominent queue number callout for elderly patients. */
    queueNumber: {
        fontWeight: 900,
        fontSize: QueuePrintTicketTypography.queueNumberSize,
        color: themeColors.brandRed,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        marginTop: 6,
        marginBottom: 4,
    },
    /** Container organizing ticket metadata (destination cubicle & PHT timestamp). */
    metaContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        flexShrink: 0,
        paddingTop: 2,
    },
    /** Row presenting assigned cubicle without pillbox styling. */
    cubicleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
        lineHeight: 1.3,
    },
    /** Cubicle title label. */
    cubicleLabel: {
        fontSize: QueuePrintTicketTypography.cubicleLabelSize,
        fontWeight: 700,
        color: "#4B5563",
    },
    /** Cubicle assigned value. */
    cubicleValue: {
        fontSize: QueuePrintTicketTypography.cubicleValueSize,
        fontWeight: 800,
        color: "#1E40AF",
    },
    /** Row presenting assigned location (legacy alias for cubicleRow). */
    locationRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
        lineHeight: 1.3,
    },
    /** Location title label (legacy alias for cubicleLabel). */
    locationLabel: {
        fontSize: QueuePrintTicketTypography.cubicleLabelSize,
        fontWeight: 700,
        color: "#4B5563",
    },
    /** Location assigned value (legacy alias for cubicleValue). */
    locationValue: {
        fontSize: QueuePrintTicketTypography.cubicleValueSize,
        fontWeight: 800,
        color: "#1E40AF",
    },
    /** Flex row grouping date and time elements with wrapping support. */
    metaRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
        fontSize: QueuePrintTicketTypography.metaDateSize,
        color: "#6B7280",
        fontWeight: 600,
        lineHeight: 1.3,
    },
    /** Dot separator between date and time elements. */
    metaDot: {
        color: "#9CA3AF",
        fontWeight: 700,
    },
} satisfies Record<string, CSSProperties>;



