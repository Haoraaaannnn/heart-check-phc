/**
 * @fileoverview Queue Ticket Printing Notice Modal Component.
 *
 * Rendered as an accessible, high-contrast modal notice when physical thermal
 * printing is unavailable (e.g., out of paper, paper jam, cover open, printer
 * offline, or no physical printer detected). Prevents cluttering the main
 * ticket screen by isolating warning copy and instructions into a clean modal dialog.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full JSDocs across all symbols (Rule 1).
 * - Separation of Concerns: Text sourced from `queuePrintTicketTexts.ts` (Rule 2).
 * - Enterprise Solid Surfaces: Solid white cards with crisp 1px borders (Rule 10).
 * - Zero Emojis Standard: Boxicons and clean typography only (Rule 6).
 * - Accessible Senior Controls: Minimum 48px touch targets without pillbox rounding (Rule 9).
 *
 * @module app/kiosk/pages/queue-print/components/QueuePrintNoticeModal
 */

"use client";

import { PrinterHardwareCondition } from "@/lib/printer/types";
import { QueuePrintTicketTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts";

/** Props for {@link QueuePrintNoticeModal}. */
interface QueuePrintNoticeModalProps {
    /** Whether the notice modal is currently visible. */
    isOpen: boolean;
    /** Detected printer hardware failure condition. */
    condition: PrinterHardwareCondition;
    /** Callback triggered when patient dismisses notice to view their ticket. */
    onDismiss: () => void;
}

/**
 * Clean modal notice informing patients when physical printing is unavailable
 * and advising them to photograph the on-screen digital ticket with their smartphone.
 *
 * @param props - Component props.
 * @returns The rendered modal notice element or null if closed.
 */
export default function QueuePrintNoticeModal({
    isOpen,
    condition,
    onDismiss,
}: QueuePrintNoticeModalProps) {
    if (!isOpen) return null;

    const T = QueuePrintTicketTexts;

    // Resolve bilingual hardware failure explanation
    let reasonFil: string = T.reasonNotDetectedFil;
    let reasonEn: string = T.reasonNotDetectedEn;

    if (condition === "out_of_paper") {
        reasonFil = T.reasonOutOfPaperFil;
        reasonEn = T.reasonOutOfPaperEn;
    } else if (condition === "paper_jam") {
        reasonFil = T.reasonPaperJamFil;
        reasonEn = T.reasonPaperJamEn;
    } else if (condition === "cover_open") {
        reasonFil = T.reasonCoverOpenFil;
        reasonEn = T.reasonCoverOpenEn;
    } else if (condition === "offline") {
        reasonFil = T.reasonOfflineFil;
        reasonEn = T.reasonOfflineEn;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-notice-title"
        >
            <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
                {/* Visual Icon Badge */}
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{
                        backgroundColor: "#FEF2F2",
                        border: "1.5px solid #FECACA",
                        color: "#C9142B",
                    }}
                >
                    <i className="bx bx-camera text-3xl font-bold" aria-hidden="true" />
                </div>

                {/* Notice Heading */}
                <h2
                    id="modal-notice-title"
                    className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-1"
                >
                    {T.noticeModalTitle}
                </h2>

                <p
                    className="text-xs sm:text-sm font-extrabold uppercase tracking-wide mb-4"
                    style={{ color: "#C9142B" }}
                >
                    {T.fallbackTitleFil}
                </p>

                {/* Explanatory instruction panel */}
                <div
                    className="w-full rounded-xl p-4 text-left flex flex-col gap-3 mb-6"
                    style={{
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                    }}
                >
                    {/* Status condition callout */}
                    <div
                        className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold"
                        style={{
                            backgroundColor: "#FFFBEB",
                            border: "1px solid #FDE68A",
                            color: "#92400E",
                        }}
                    >
                        <i
                            className="bx bx-error-circle text-lg flex-shrink-0 mt-0.5"
                            style={{ color: "#B45309" }}
                            aria-hidden="true"
                        />
                        <div>
                            <span style={{ color: "#78350F" }}>{reasonFil}</span>
                            <span
                                className="block text-xs font-semibold mt-0.5"
                                style={{ color: "#92400E" }}
                            >
                                {reasonEn}
                            </span>
                        </div>
                    </div>

                    {/* Step-by-step guidance */}
                    <div className="flex flex-col gap-1 px-1 pt-0.5">
                        <p className="text-sm sm:text-base font-bold leading-snug m-0 text-slate-900">
                            {T.photoInstructionFil}
                        </p>
                        <p className="text-xs sm:text-sm font-medium leading-snug m-0 text-slate-600">
                            {T.photoInstructionEn}
                        </p>
                    </div>
                </div>

                {/* Acknowledgment action button */}
                <button
                    type="button"
                    onClick={onDismiss}
                    style={{
                        backgroundColor: "#0F172A",
                        color: "#FFFFFF",
                        border: "none",
                        width: "100%",
                        height: 52,
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: 16,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.15)",
                    }}
                    aria-label="I understand, view ticket"
                >
                    <i className="bx bx-check-circle text-xl" aria-hidden="true" />
                    <span>{T.noticeModalDismissFil}</span>
                </button>
            </div>
        </div>
    );
}
