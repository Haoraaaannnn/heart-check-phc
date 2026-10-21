/**
 * @file queuePrintTicket.ts
 * @description Centralized visual styles for `QueuePrintContent` printed ticket display.
 *
 * Defines typography tokens and CSS properties for the on-screen physical ticket
 * preview, including document type badge, service identifiers, Manila timestamp,
 * destination cubicle, highlighted queue number, and bilingual patient guidance.
 * Scaled with fluid viewport-height (`vh`) clamps to guarantee zero scrolling
 * on both landscape and portrait kiosk orientations.
 *
 * @module app/kiosk/pages/queue-print/constants/queuePrintTicket
 */

import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/** Number of milliseconds to display the ticket on screen before returning to entrance. */
export const QUEUE_PRINT_REDIRECT_DELAY_MS = 5000;

/** Typography tokens for printed ticket card, scaled with responsive fluid clamps. */
export const QueuePrintTicketTypography = {
    /** Primary Filipino service title typography scale. */
    serviceTitleSize: "clamp(18px, 2.4vh, 26px)",
    /** Secondary English service title typography scale (no pillbox). */
    serviceSubtitleSize: "clamp(13px, 1.7vh, 17px)",
    /** English primary queue callout label text scale. */
    queueLabelSize: "clamp(14px, 1.8vh, 18px)",
    /** Filipino secondary queue subtitle text scale. */
    queueLabelFilSize: "clamp(11px, 1.4vh, 14px)",
    /** Main highlighted queue ticket number font scale for maximum readability. */
    queueNumberSize: "clamp(52px, 6.8vh, 76px)",
    /** Destination cubicle label font scale. */
    cubicleLabelSize: "clamp(12px, 1.6vh, 15px)",
    /** Destination cubicle value font scale. */
    cubicleValueSize: "clamp(14px, 1.8vh, 18px)",
    /** Destination location label font scale (legacy alias for cubicleLabelSize). */
    locationLabelSize: "clamp(12px, 1.6vh, 15px)",
    /** Destination location value font scale (legacy alias for cubicleValueSize). */
    locationValueSize: "clamp(14px, 1.8vh, 18px)",
    /** Timestamp text font scale. */
    metaDateSize: "clamp(12px, 1.5vh, 14px)",
    /** Primary English EWT title text scale. */
    ewtLabelSize: "clamp(12px, 1.6vh, 15px)",
    /** Secondary Filipino EWT title text scale. */
    ewtLabelFilSize: "clamp(11px, 1.3vh, 13px)",
    /** Highlighted estimated wait time range value typography scale. */
    ewtValueSize: "clamp(17px, 2.3vh, 23px)",
    /** Disclaimer typography scale. */
    ewtDisclaimerSize: "clamp(10px, 1.3vh, 12px)",
} as const;

/** Inline styles for `QueuePrintContent`. */
export const QueuePrintTicketStyle = {
    /** Outermost card container representing the physical queue ticket. */
    ticketContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "clamp(4px, 0.8vh, 8px)",
        backgroundColor: themeColors.white,
        borderRadius: 18,
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor: "#E2E8F0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        paddingTop: "clamp(8px, 1.4vh, 16px)",
        paddingBottom: "clamp(8px, 1.4vh, 16px)",
        paddingLeft: "clamp(16px, 2.2vw, 28px)",
        paddingRight: "clamp(16px, 2.2vw, 28px)",
        maxWidth: 480,
        width: "100%",
        boxSizing: "border-box",
        flexShrink: 1,
        margin: "0 auto",
    },
    /** Header section wrapping service title and English subtitle. */
    serviceHeader: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        width: "100%",
        flexShrink: 0,
    },
    /** Filipino service name heading. */
    serviceTitle: {
        fontSize: QueuePrintTicketTypography.serviceTitleSize,
        fontWeight: 900,
        color: "#111827",
        lineHeight: 1.15,
        margin: 0,
    },
    /** English service name subtitle (clean text, no pillbox). */
    serviceSubtitle: {
        fontSize: QueuePrintTicketTypography.serviceSubtitleSize,
        fontWeight: 700,
        color: themeColors.brandRed,
        lineHeight: 1.2,
        margin: 0,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
    /** Full-width subtle horizontal divider. */
    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#E2E8F0",
        marginTop: 1,
        marginBottom: 1,
        flexShrink: 0,
    },
    /** Wrapper highlighting the patient's queue number. */
    queueWrapper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingTop: 1,
        paddingBottom: 1,
        flexShrink: 0,
    },
    /** English queue label above the number. */
    queueLabel: {
        fontSize: QueuePrintTicketTypography.queueLabelSize,
        fontWeight: 700,
        color: "#4B5563",
        lineHeight: 1.2,
        margin: 0,
    },
    /** Filipino secondary queue subtitle. */
    queueLabelFil: {
        fontSize: QueuePrintTicketTypography.queueLabelFilSize,
        fontWeight: 600,
        color: "#6B7280",
        lineHeight: 1.15,
        marginTop: 1,
        marginBottom: 0,
    },
    /** Prominent queue number callout for elderly patients. */
    queueNumber: {
        fontWeight: 900,
        fontSize: QueuePrintTicketTypography.queueNumberSize,
        color: themeColors.brandRed,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        marginTop: 2,
        marginBottom: 1,
    },
    /** Container organizing ticket metadata (destination cubicle & PHT timestamp). */
    metaContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        width: "100%",
        flexShrink: 0,
        paddingTop: 1,
    },
    /** Row presenting assigned cubicle without pillbox styling. */
    cubicleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flexWrap: "wrap",
        lineHeight: 1.2,
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
        gap: 6,
        flexWrap: "wrap",
        lineHeight: 1.2,
    },
    /** Location title label (legacy alias for cubicleLabel). */
    locationLabel: {
        fontSize: QueuePrintTicketTypography.locationLabelSize,
        fontWeight: 700,
        color: "#4B5563",
    },
    /** Location assigned value (legacy alias for cubicleValue). */
    locationValue: {
        fontSize: QueuePrintTicketTypography.locationValueSize,
        fontWeight: 800,
        color: "#1E40AF",
    },
    /** Flex row grouping date and time elements with wrapping support. */
    metaRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flexWrap: "wrap",
        fontSize: QueuePrintTicketTypography.metaDateSize,
        color: "#6B7280",
        fontWeight: 600,
        lineHeight: 1.2,
    },
    /** Dot separator between date and time elements. */
    metaDot: {
        color: "#9CA3AF",
        fontWeight: 700,
    },
    /** Container wrapping the Estimated Wait Time callout on the ticket. */
    ewtContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingTop: 1,
        paddingBottom: 1,
        flexShrink: 0,
    },
    /** English EWT title. */
    ewtLabel: {
        fontSize: QueuePrintTicketTypography.ewtLabelSize,
        fontWeight: 700,
        color: "#4B5563",
        lineHeight: 1.2,
        margin: 0,
    },
    /** Filipino secondary EWT title. */
    ewtLabelFil: {
        fontSize: QueuePrintTicketTypography.ewtLabelFilSize,
        fontWeight: 600,
        color: "#6B7280",
        lineHeight: 1.15,
        marginTop: 1,
        marginBottom: 0,
    },
    /** Highlighted EWT range text. */
    ewtValue: {
        fontSize: QueuePrintTicketTypography.ewtValueSize,
        fontWeight: 900,
        color: "#1E40AF",
        lineHeight: 1.15,
        marginTop: 2,
        marginBottom: 1,
        wordBreak: "break-word",
        whiteSpace: "normal",
    },
    /** Disclaimer notice below EWT range. */
    ewtDisclaimer: {
        fontSize: QueuePrintTicketTypography.ewtDisclaimerSize,
        fontWeight: 500,
        color: "#6B7280",
        lineHeight: 1.2,
        marginTop: 1,
        wordBreak: "break-word",
        whiteSpace: "normal",
    },
} satisfies Record<string, CSSProperties>;




