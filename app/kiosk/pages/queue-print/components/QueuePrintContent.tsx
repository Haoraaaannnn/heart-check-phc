/**
 * @fileoverview Queue Ticket Printing Confirmation Content.
 *
 * Displays the patient queue number, estimated wait time, destination cubicle,
 * and handles ESC/POS hardware print dispatch. When physical tickets cannot be issued
 * (out of paper, paper jam, cover open, printer offline, or not detected), dynamically
 * activates the on-screen fallback card providing smartphone photo instructions
 * and immediate completion controls. Phone entry is already handled on the preceding SMS screen.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full JSDocs across all symbols (Rule 1).
 * - Separation of Concerns: Copy from `queuePrintTicketTexts.ts`, styles from `queuePrintTicket.ts`
 *   and `queuePrintFallbackStyles.ts` (Rule 2).
 * - Kiosk Centering: Elements centered vertically and horizontally between topNav and wave footer (Rule 9).
 * - Zero Emojis Standard: Replaced with Boxicons and clean text (Rule 6).
 * - Non-Truncated Clinical Data: Natural wrapping without ellipsis (Rule 11).
 *
 * @module app/kiosk/pages/queue-print/components/QueuePrintContent
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { Service } from "@/types/Services";
import { getTimestamp } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { formatManilaNumericDate, formatManilaTime } from "@/utils/formatDateTime";
import {
    QueuePrintTicketStyle,
} from "@/app/kiosk/pages/queue-print/constants/queuePrintTicket";
import { QueuePrintTicketTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts";
import { formatEwtLabel, EWT_TEXTS } from "@/app/kiosk/constants/ewtTexts";
import { useWebPrinter } from "@/app/kiosk/hooks/useWebPrinter";
import { PrinterHardwareCondition } from "@/lib/printer/types";
import QueuePrintFallbackCard from "@/app/kiosk/pages/queue-print/components/QueuePrintFallbackCard";
import PrintFooter from "@/app/kiosk/pages/queue-print/components/PrintFooter";
import { useIsLandscape } from "@/hooks/useIsLandscape";
import { useIsMounted } from "@/hooks/useIsMounted";

/** Props for {@link QueuePrintContent}. */
interface QueuePrintContentProps {
    /** The service record associated with this ticket. */
    service: Service;
    /** The generated queue code (e.g. "C001", "1002"). */
    patientNum: string;
    /** The destination cubicle number or waiting area string. */
    cubicleNum: string;
}

/**
 * Display card presenting the generated queue number, estimated wait time,
 * and triggering physical ticket printing with on-screen fallback resilience.
 *
 * @param props - Component props.
 * @returns The printed ticket confirmation view.
 */
export default function QueuePrintContent({
    service,
    patientNum,
    cubicleNum,
}: QueuePrintContentProps) {
    const router = useRouter();
    const { hardwareStatus, printEscPos } = useWebPrinter();
    const isLandscape = useIsLandscape();
    const mounted = useIsMounted();

    // Guard against React StrictMode initiating double print API requests
    const hasFired = useRef(false);

    // Formatted Manila Standard Time (PHT) state for hydration-safe rendering
    const [manilaDate, setManilaDate] = useState<string>("");
    const [manilaTime, setManilaTime] = useState<string>("");
    const [activeCubicle, setActiveCubicle] = useState<string>(cubicleNum);
    const [estimatedWaitLabel, setEstimatedWaitLabel] = useState<string>(EWT_TEXTS.calculating);
    // Fallback state when physical tickets cannot be issued
    const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);
    const [fallbackCondition, setFallbackCondition] = useState<PrinterHardwareCondition>('not_detected');
    const [countdownSeconds, setCountdownSeconds] = useState<number>(7);

    useEffect(() => {
        if (cubicleNum && cubicleNum !== "---" && cubicleNum.toLowerCase() !== "waiting area") {
            setActiveCubicle(cubicleNum);
        }
    }, [cubicleNum]);

    const serviceName = service?.label_en || QueuePrintTicketTexts.defaultService;
    const rawCubicle =
        !activeCubicle || activeCubicle === "---" || activeCubicle.toLowerCase() === "waiting area"
            ? QueuePrintTicketTexts.defaultLocation
            : activeCubicle;
    const displayCubicle =
        rawCubicle === QueuePrintTicketTexts.defaultLocation
            ? rawCubicle
            : rawCubicle.replace(/^cubicle\s*/i, "");

    useEffect(() => {
        const now = new Date();
        setManilaDate(formatManilaNumericDate(now));
        setManilaTime(`${formatManilaTime(now, true)} ${QueuePrintTicketTexts.manilaTzSuffix}`);
    }, []);

    useEffect(() => {
        if (hasFired.current) return;
        hasFired.current = true;

        /**
         * Queries the newly created patient record for diagnostic logging, cubicle fallback,
         * pre-existing estimated wait time, and phone contact for SMS fallback.
         */
        const fetchAndLogPatientRecord = async () => {
            try {
                const now = new Date();
                const startOfDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                ).toISOString();

                const { data: patientRecord, error } = await supabase
                    .from("patients")
                    .select("id, created_at, patientNum, phoneNum, service, cubicleNum, preferredCubicleNums, estimated_wait_minutes")
                    .eq("patientNum", patientNum)
                    .gte("created_at", startOfDay)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;

                const dbCubicle =
                    patientRecord?.cubicleNum ||
                    (Array.isArray(patientRecord?.preferredCubicleNums) && patientRecord.preferredCubicleNums[0]) ||
                    null;

                if (
                    dbCubicle &&
                    (!activeCubicle || activeCubicle === "---" || activeCubicle.toLowerCase() === "waiting area")
                ) {
                    setActiveCubicle(dbCubicle);
                }

                if (patientRecord?.estimated_wait_minutes) {
                    setEstimatedWaitLabel(formatEwtLabel(patientRecord.estimated_wait_minutes));
                }

                console.log(`${getTimestamp()} [QUEUE PRINT PAGE] Loaded:`, {
                    id: patientRecord?.id,
                    created_at: patientRecord?.created_at,
                    patientNum: patientRecord?.patientNum,
                    hasPhone: Boolean(patientRecord?.phoneNum),
                    service: patientRecord?.service,
                    cubicle: dbCubicle,
                    estimatedWaitMinutes: patientRecord?.estimated_wait_minutes,
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.log(
                    `${getTimestamp()} [QUEUE PRINT PAGE] Loaded - PatientNum: ${patientNum}, Service: ${serviceName} (DB Fetch Note: ${errorMessage})`
                );
            }
        };

        fetchAndLogPatientRecord();
        console.log(
            `${getTimestamp()} [PRINT JOB INITIATED] Preparing to send ticket to printer - Queue: ${patientNum}, Service: ${serviceName}, Cubicle: ${displayCubicle}`
        );

        /**
         * Dispatches print payload to the hardware printer endpoint, which computes
         * and persists the Estimated Wait Time, attempting physical printing.
         */
        const printTicket = async () => {
            try {
                console.log(
                    `${getTimestamp()} [PRINT API CALL] Sending print request - Queue: ${patientNum}`
                );
                const response = await fetch("/api/print-ticket", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        queueNumber: patientNum,
                        serviceName: serviceName,
                        cubicle: displayCubicle,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    const ewtMin = data?.data?.estimatedWaitMinutes;
                    const ewtDisplay = data?.data?.estimatedWaitLabel || (ewtMin ? formatEwtLabel(ewtMin) : null);
                    if (ewtDisplay) {
                        setEstimatedWaitLabel(ewtDisplay);
                    }

                    const printMethod = data?.data?.printMethod;
                    const escposBase64 = data?.data?.escposBase64;
                    const printedByServer = Boolean(data?.data?.printed);

                    if (printedByServer) {
                        console.log(
                            `${getTimestamp()} [PRINT SUCCESS] Printed by server via ${printMethod} - Queue: ${patientNum}, EWT: ${ewtDisplay || 'N/A'}`
                        );
                        setIsFallbackActive(false);
                        setCountdownSeconds(7);
                    } else if (escposBase64) {
                        // Dispatch to connected WebUSB / WebSerial printer on this client device
                        try {
                            const clientPrint = await printEscPos(escposBase64);
                            if (clientPrint.success) {
                                console.log(
                                    `${getTimestamp()} [PRINT SUCCESS] Printed via Client WebUSB/Serial - Queue: ${patientNum}, EWT: ${ewtDisplay || 'N/A'}`
                                );
                                setIsFallbackActive(false);
                                setCountdownSeconds(7);
                            } else {
                                console.log(
                                    `${getTimestamp()} [PRINT FALLBACK] Client printer not ready (${clientPrint.message}) - Queue: ${patientNum}. Activating on-screen photo/SMS fallback.`
                                );
                                setIsFallbackActive(true);
                                setFallbackCondition(
                                    hardwareStatus?.condition !== 'ready'
                                        ? hardwareStatus.condition
                                        : 'not_detected'
                                );
                                setCountdownSeconds(25);
                            }
                        } catch (clientErr) {
                            console.warn(
                                `${getTimestamp()} [CLIENT PRINT ERROR]`,
                                clientErr
                            );
                            setIsFallbackActive(true);
                            setFallbackCondition('offline');
                            setCountdownSeconds(25);
                        }
                    } else {
                        // Server did not print and no client payload was returned
                        setIsFallbackActive(true);
                        setFallbackCondition(
                            hardwareStatus?.condition !== 'ready'
                                ? hardwareStatus.condition
                                : 'not_detected'
                        );
                        setCountdownSeconds(25);
                    }
                } else {
                    console.warn(
                        `${getTimestamp()} [PRINT WARNING] Print API error status:`,
                        response.status,
                        data.error || "Unknown error"
                    );
                    setIsFallbackActive(true);
                    setFallbackCondition('offline');
                    setCountdownSeconds(25);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(
                    `${getTimestamp()} [PRINT FETCH ERROR] Failed to call print API:`,
                    errorMessage
                );
                setIsFallbackActive(true);
                setFallbackCondition('offline');
                setCountdownSeconds(25);
            }
        };

        printTicket();
    }, [patientNum, serviceName, displayCubicle, activeCubicle, hardwareStatus, printEscPos]);

    // Live auto-close countdown ticking to redirect back to kiosk entrance
    useEffect(() => {
        if (countdownSeconds <= 0) {
            console.log(
                `${getTimestamp()} [REDIRECT TIMER] Countdown completed - Redirecting to entrance.`
            );
            router.push("/kiosk/pages/kiosk-new-old-selection");
            return;
        }

        const timer = setInterval(() => {
            setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [countdownSeconds, router]);

    /**
     * Completes queue ticket viewing immediately upon patient action.
     */
    const handleFinish = useCallback(() => {
        console.log(
            `${getTimestamp()} [TICKET FINISH TAP] Patient tapped finish - returning to entrance.`
        );
        router.push("/kiosk/pages/kiosk-new-old-selection");
    }, [router]);

    const ticketCardElement = (
        <div style={QueuePrintTicketStyle.ticketContainer}>
            {/* Service Information - Large & Clean Typography (No Pillbox) */}
            <div style={QueuePrintTicketStyle.serviceHeader}>
                {service?.label_fil && (
                    <span style={QueuePrintTicketStyle.serviceTitle}>
                        {service.label_fil}
                    </span>
                )}

                <span style={QueuePrintTicketStyle.serviceSubtitle}>
                    {serviceName}
                </span>
            </div>

            {/* Separator Divider */}
            <div style={QueuePrintTicketStyle.divider} />

            {/* Hero Queue Number Callout - Maximum Visibility for Seniors */}
            <div style={QueuePrintTicketStyle.queueWrapper}>
                <span style={QueuePrintTicketStyle.queueLabel}>
                    {QueuePrintTicketTexts.queueLabel}
                </span>
                <span style={QueuePrintTicketStyle.queueLabelFil}>
                    {QueuePrintTicketTexts.queueLabelFil}
                </span>
                <span style={QueuePrintTicketStyle.queueNumber}>
                    {patientNum}
                </span>
            </div>

            {/* Separator Divider */}
            <div style={QueuePrintTicketStyle.divider} />

            {/* Estimated Wait Time Callout - Range Display without False Precision */}
            <div style={QueuePrintTicketStyle.ewtContainer}>
                <span style={QueuePrintTicketStyle.ewtLabel}>
                    {QueuePrintTicketTexts.ewtLabel}
                </span>
                <span style={QueuePrintTicketStyle.ewtLabelFil}>
                    {QueuePrintTicketTexts.ewtLabelFil}
                </span>
                <span style={QueuePrintTicketStyle.ewtValue}>
                    {estimatedWaitLabel}
                </span>
                <span style={QueuePrintTicketStyle.ewtDisclaimer}>
                    {QueuePrintTicketTexts.ewtDisclaimer}
                </span>
            </div>

            {/* Separator Divider */}
            <div style={QueuePrintTicketStyle.divider} />

            {/* Ticket Metadata - Clean Text without Pillbox */}
            <div style={QueuePrintTicketStyle.metaContainer}>
                <div style={QueuePrintTicketStyle.cubicleRow}>
                    <span style={QueuePrintTicketStyle.cubicleLabel}>
                        {QueuePrintTicketTexts.cubiclePrefix}
                    </span>
                    <span style={QueuePrintTicketStyle.cubicleValue}>
                        {displayCubicle}
                    </span>
                </div>

                <div style={QueuePrintTicketStyle.metaRow}>
                    <span>{manilaDate || "--/--/----"}</span>
                    <span style={QueuePrintTicketStyle.metaDot}>•</span>
                    <span>{manilaTime || "--:--:-- --"}</span>
                </div>
            </div>
        </div>
    );

    const isEffectiveLandscape = mounted ? isLandscape : false;

    return (
        <div className="m-auto flex flex-col items-center justify-center w-full max-h-full overflow-hidden px-3 sm:px-6 py-2">
            {isFallbackActive ? (
                /* Fallback Mode: 2-column side-by-side in Landscape, compact vertical stack in Portrait */
                <div
                    className={
                        isEffectiveLandscape
                            ? "grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center justify-center w-full max-w-[1040px] max-h-full m-auto"
                            : "flex flex-col gap-3 items-center justify-center w-full max-w-[480px] max-h-full m-auto"
                    }
                >
                    {ticketCardElement}
                    <QueuePrintFallbackCard
                        condition={fallbackCondition}
                        onFinish={handleFinish}
                        countdownSeconds={countdownSeconds}
                    />
                </div>
            ) : (
                /* Normal Mode: Ticket Card centered with PrintFooter below */
                <div className="flex flex-col items-center justify-center w-full max-w-lg max-h-full overflow-hidden gap-3 sm:gap-4">
                    {ticketCardElement}
                    <PrintFooter />
                </div>
            )}
        </div>
    );
}