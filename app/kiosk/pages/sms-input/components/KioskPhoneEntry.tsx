"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTimestamp } from "@/lib/logger";
import { Service } from "@/types/Services";
import { useKioskLoading } from "@/app/kiosk/context/KioskLoadingContext";
import PhoneInput from "./PhoneInput";
import NumPad from "./NumPad";
import ContinueButton from "./ContinueButton";
import SMSInstruction from "./SMSInstruction";
import {
    SMS_PHONE_MAX_LENGTH,
    SMS_SERVICE_PREFIXES,
    NUMERIC_PREFIX_RULES,
} from "@/app/kiosk/pages/sms-input/constants/smsInput";

/** Props for {@link KioskPhoneEntry}. */
interface KioskPhoneEntryProps {
    /** The service record for which the ticket is being created. */
    service: Service;
    /** Existing patient queue number if already generated. */
    patientNum?: string;
    /** Comma-separated preferred cubicle numbers from earlier step. */
    preferredCubicleNums?: string;
    /** Subcategory selected (e.g. "Adult" or "Pedia"). */
    subcategory?: string;
}

/**
 * Resolves the queue ticket prefix and grouping strategy for a service.
 */
function getPrefixInfo(service: Service, subcategory?: string) {
    const name = service.label_en;
    const rule = NUMERIC_PREFIX_RULES.find((r) => r.match(name, subcategory));
    if (rule) {
        return { prefix: rule.prefix, groupBySubcategory: rule.groupBySubcategory };
    }
    return { prefix: SMS_SERVICE_PREFIXES[name] ?? "C", groupBySubcategory: false };
}

/**
 * Builds the URL for the SMS page's "Bumalik - Cancel" button.
 *
 * @param serviceId - The `id` of the service being booked.
 * @param patientType - The `type` query param ("new" | "old"), if present.
 * @param subcategory - The Adult/Pedia category, if one was chosen.
 * @returns The relative URL for the Cancel button's `href`.
 */
function buildCancelHref(
    serviceId: number | string | undefined,
    patientType: string | null,
    subcategory: string | undefined
): string {
    if (subcategory) {
        const params = new URLSearchParams();
        if (serviceId !== undefined) params.set("serviceId", String(serviceId));
        if (patientType) params.set("type", patientType);
        params.set("subcategory", subcategory);
        return `/kiosk/pages/kiosk-cubicle-selection?${params.toString()}`;
    }

    return patientType
        ? `/kiosk/pages/kiosk-services?type=${encodeURIComponent(patientType)}`
        : "/kiosk/pages/kiosk-services";
}

/**
 * Interactive phone entry controller coordinating keypad input, formatting,
 * and database ticket creation via Supabase RPC (`create_patient`).
 *
 * @param props - Component props.
 * @returns The complete phone number input layout with keypad and action triggers.
 */
export default function KioskPhoneEntry({
    service,
    patientNum: initialPatientNum,
    preferredCubicleNums,
    subcategory,
}: KioskPhoneEntryProps) {
    const preferredList = preferredCubicleNums ? preferredCubicleNums.split(",") : null;
    const [phone, setPhone] = useState("");
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [patientNum, setPatientNum] = useState<string | undefined>(initialPatientNum);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showLoading, hideLoading } = useKioskLoading();

    const patientType = searchParams.get("type");
    const cancelHref = buildCancelHref(service?.id, patientType, subcategory);

    const addDigit = (digit: string) => {
        if (phone.length < SMS_PHONE_MAX_LENGTH) setPhone((p) => p + digit);
    };

    const deleteLast = () => setPhone((p) => p.slice(0, -1));

    /**
     * Executes the `create_patient` stored procedure in Supabase.
     */
    const createPatient = async (phoneToSave: string | null): Promise<string> => {
        const { prefix, groupBySubcategory } = getPrefixInfo(service, subcategory);

        const t0 = performance.now();
        const { data, error } = await supabase.rpc("create_patient", {
            p_service: service.label_en,
            p_subcategory: subcategory ?? null,
            p_preferred_cubicles: preferredList,
            p_prefix: prefix,
            p_group_by_subcategory: groupBySubcategory,
            p_phone: phoneToSave,
        });
        const elapsed = Math.round(performance.now() - t0);

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("RPC returned no row");

        const row = data[0];
        console.log(`${getTimestamp()} [DB INSERT] New Patient Created in ${elapsed}ms:`, {
            id: row.id,
            patientNum: row.patientNum,
            queue_position: row.queue_position,
            service: service.label_en,
        });
        return row.patientNum;
    };

    /**
     * Handles patient confirmation of phone number and transitions to ticket printing.
     */
    const handleContinueConfirm = async () => {
        setShowContinueModal(false);
        showLoading("Creating queue ticket...");
        try {
            const finalPatientNum = patientNum ?? (await createPatient(phone));
            setPatientNum(finalPatientNum);
            router.push(`/kiosk/pages/queue-print?patientNum=${finalPatientNum}&serviceId=${service.id}`);
        } catch (e) {
            hideLoading();
            console.error(`${getTimestamp()} [SMS CONTINUE ERROR]`, {
                message: e instanceof Error ? e.message : String(e),
                details: e,
                stack: e instanceof Error ? e.stack : undefined,
            });
        }
    };

    /**
     * Handles skipping phone entry and transitions to ticket printing.
     */
    const handleSkipConfirm = async () => {
        setShowSkipModal(false);
        showLoading("Creating queue ticket...");
        try {
            const finalPatientNum = patientNum ?? (await createPatient(null));
            setPatientNum(finalPatientNum);
            console.log(`${getTimestamp()} [SMS SKIP] Patient created without phone:`, {
                patientNum: finalPatientNum,
                service: service.label_en,
            });
            router.push(`/kiosk/pages/queue-print?patientNum=${finalPatientNum}&serviceId=${service.id}`);
        } catch (e) {
            hideLoading();
            console.error(`${getTimestamp()} [SMS SKIP ERROR]`, {
                message: e instanceof Error ? e.message : String(e),
                details: e,
                stack: e instanceof Error ? e.stack : undefined,
            });
        }
    };

    return (
        <div className="h-full min-h-0 w-full grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 md:gap-6 p-4 md:p-6 overflow-hidden bg-white landscape:grid-cols-[1.2fr_1fr] landscape:grid-rows-[auto_minmax(0,1fr)_auto] landscape:gap-x-12 landscape:gap-y-6">
            {/* Left Column (Landscape): Instructions and Phone Display */}
            <div className="flex w-full flex-col gap-3 sm:gap-4 landscape:col-start-1 landscape:row-start-1 landscape:row-span-2 landscape:justify-center landscape:items-start">
                <SMSInstruction service={service} />
                <PhoneInput phone={phone} onDelete={deleteLast} service={service} />
            </div>

            {/* Right Column (Landscape): Keypad */}
            <div className="flex h-full w-full items-center justify-center portrait:py-4 landscape:items-center landscape:justify-end landscape:col-start-2 landscape:row-start-1 landscape:row-span-2 landscape:px-4 lg:landscape:px-8">
                <NumPad onDigit={addDigit} />
            </div>

            {/* Bottom Row: Action Controls */}
            <div className="flex-none w-full landscape:col-start-1 landscape:col-end-3 landscape:row-start-3">
                <ContinueButton
                    disabled={phone.length !== SMS_PHONE_MAX_LENGTH}
                    onContinue={() => setShowContinueModal(true)}
                    onSkip={() => setShowSkipModal(true)}
                    service={service}
                    phone={phone}
                    showContinueModal={showContinueModal}
                    showSkipModal={showSkipModal}
                    onContinueConfirm={handleContinueConfirm}
                    onSkipConfirm={handleSkipConfirm}
                    onContinueCancel={() => setShowContinueModal(false)}
                    onSkipCancel={() => setShowSkipModal(false)}
                    href={cancelHref}
                />
            </div>
        </div>
    );
}