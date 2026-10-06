"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Service } from "@/types/Services";
import { getTimestamp } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { formatManilaNumericDate, formatManilaTime } from "@/utils/formatDateTime";
import {
    QUEUE_PRINT_REDIRECT_DELAY_MS,
    QueuePrintTicketStyle,
} from "@/app/kiosk/pages/queue-print/constants/queuePrintTicket";
import { QueuePrintTicketTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts";

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
 * Display card presenting the generated queue number and triggering physical ticket printing.
 *
 * @remarks
 * Displays the refined physical ticket preview (queue number, service, Manila Standard Time,
 * destination cubicle, and bilingual patient reminder without institutional header),
 * sends an ESC/POS print dispatch request to `/api/print-ticket`, and automatically redirects
 * back to the kiosk welcome screen after a 5-second countdown.
 *
 * @param props - Component props.
 * @returns The printed ticket confirmation card.
 */
export default function QueuePrintContent({
    service,
    patientNum,
    cubicleNum,
}: QueuePrintContentProps) {
    const router = useRouter();

    // Guard against React StrictMode initiating double print API requests
    const hasFired = useRef(false);

    // Formatted Manila Standard Time (PHT) state for hydration-safe rendering
    const [manilaDate, setManilaDate] = useState<string>("");
    const [manilaTime, setManilaTime] = useState<string>("");
    const [activeCubicle, setActiveCubicle] = useState<string>(cubicleNum);

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
         * Queries the newly created patient record for diagnostic logging and cubicle fallback.
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
                    .select("id, created_at, patientNum, phoneNum, service, cubicleNum, preferredCubicleNums")
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

                console.log(`${getTimestamp()} [QUEUE PRINT PAGE] Loaded:`, {
                    id: patientRecord?.id,
                    created_at: patientRecord?.created_at,
                    patientNum: patientRecord?.patientNum,
                    hasPhone: Boolean(patientRecord?.phoneNum),
                    service: patientRecord?.service,
                    cubicle: dbCubicle,
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
         * Dispatches print payload to the hardware printer endpoint.
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
                    console.log(
                        `${getTimestamp()} [PRINT SUCCESS] Ticket successfully printed - Queue: ${patientNum}`
                    );
                } else {
                    console.warn(
                        `${getTimestamp()} [PRINT WARNING] Print API error status:`,
                        response.status,
                        data.error || "Unknown error"
                    );
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(
                    `${getTimestamp()} [PRINT FETCH ERROR] Failed to call print API:`,
                    errorMessage
                );
            }
        };

        printTicket();
    }, [patientNum, serviceName, displayCubicle]);

    // Automatic navigation timer redirecting back to kiosk entrance
    useEffect(() => {
        const redirectTimer = setTimeout(() => {
            console.log(
                `${getTimestamp()} [REDIRECT TIMER] Timeout completed - Redirecting back to kiosk entrance.`
            );
            router.push("/kiosk/pages/kiosk-new-old-selection");
        }, QUEUE_PRINT_REDIRECT_DELAY_MS);

        return () => clearTimeout(redirectTimer);
    }, [router]);

    return (
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

}