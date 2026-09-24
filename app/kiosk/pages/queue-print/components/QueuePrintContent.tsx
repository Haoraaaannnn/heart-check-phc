"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Service } from "@/types/Services";
import { getTimestamp } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { QUEUE_PRINT_REDIRECT_DELAY_MS } from "@/app/kiosk/pages/queue-print/constants/queuePrint";
import { queuePrintTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";
import { themeColors } from "@/constants/colors";

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
 * Sends a print request to `/api/print-ticket` via an asynchronous POST request,
 * fetches patient log confirmation from Supabase, and automatically redirects
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

    useEffect(() => {
        if (hasFired.current) return;
        hasFired.current = true;

        const serviceName = service?.label_en || "Service";
        const location = cubicleNum || "Waiting Area";

        /**
         * Queries the newly created patient record for diagnostic logging.
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
                    .select()
                    .eq("patientNum", patientNum)
                    .gte("created_at", startOfDay)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;

                console.log(`${getTimestamp()} [QUEUE PRINT PAGE] Loaded:`, {
                    id: patientRecord?.id,
                    created_at: patientRecord?.created_at,
                    patientNum: patientRecord?.patientNum,
                    phoneNum: patientRecord?.phoneNum,
                    service: patientRecord?.service,
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
            `${getTimestamp()} [PRINT JOB INITIATED] Preparing to send ticket to printer - Queue: ${patientNum}, Service: ${serviceName}, Cubicle: ${location}`
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
                        cubicle: location,
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
    }, [patientNum, service?.label_en, service?.label_fil, cubicleNum]);

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
        <div className="w-full max-w-lg md:max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 flex flex-col items-center justify-center gap-4 text-center">
            {/* Service Information */}
            <div className="flex flex-col items-center justify-center gap-2">
                {service?.label_fil && (
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                        {service.label_fil}
                    </span>
                )}

                <span
                    className="text-sm sm:text-base font-bold text-white px-5 py-1.5 rounded-full shadow-sm"
                    style={{ backgroundColor: themeColors.brandRed }}
                >
                    {service?.label_en || "Consultation"}
                </span>
            </div>

            {/* Separator Divider */}
            <div className="w-full h-px bg-gray-200 my-1" />

            {/* Queue Number Callout */}
            <div className="flex flex-col items-center justify-center w-full py-2">
                <span className="text-sm sm:text-base font-bold text-gray-500 mb-1">
                    {queuePrintTexts.queueLabel}
                </span>

                <span className="text-[clamp(64px,14vh,110px)] font-black text-gray-900 leading-none tracking-tight py-2">
                    {patientNum}
                </span>
            </div>
        </div>
    );
}