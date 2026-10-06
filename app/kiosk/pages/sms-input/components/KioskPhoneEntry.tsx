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
import SMSHeader from "./SMSHeader";
import { SMS_PHONE_MAX_LENGTH } from "@/app/kiosk/pages/sms-input/constants/smsPhoneInput";
import {
    SMSLayoutClasses,
    SMSLayoutStyle,
} from "@/app/kiosk/pages/sms-input/constants/smsLayout";
import {
    SMS_SERVICE_PREFIXES,
    NUMERIC_PREFIX_RULES,
} from "@/app/kiosk/pages/sms-input/constants/smsInput";
import {
    getNextPhoneValue,
    validatePhMobileNumber,
} from "@/app/kiosk/pages/sms-input/utils/phoneValidation";
import { SMSValidationTexts } from "@/app/kiosk/pages/sms-input/constants/smsValidationTexts";
import { encryptPatientPhoneAction } from "@/app/actions/phoneSecurity";

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
    /** Selected cubicle name or number from cubicle selection step. */
    cubicleNum?: string;
}

/**
 * Resolves the queue ticket prefix and grouping strategy for a service.
 *
 * @remarks
 * The lookup against {@link SMS_SERVICE_PREFIXES} is performed case-insensitively
 * to guard against casing mismatches between the DB `label_en` value and the
 * map keys (e.g. "Opd Card" vs "OPD Card"). The first matching numeric rule
 * always takes priority over the prefix map.
 */
function getPrefixInfo(service: Service, subcategory?: string) {
    const name = service.label_en;
    const rule = NUMERIC_PREFIX_RULES.find((r) => r.match(name, subcategory));
    if (rule) {
        return { prefix: rule.prefix, groupBySubcategory: rule.groupBySubcategory };
    }

    // Case-insensitive lookup: find the first map key that matches label_en
    // regardless of capitalisation (e.g. "OPD Card" == "opd card").
    const nameLower = name?.toLowerCase() ?? "";
    const matchedKey = Object.keys(SMS_SERVICE_PREFIXES).find(
        (k) => k.toLowerCase() === nameLower
    );
    return {
        prefix: matchedKey ? SMS_SERVICE_PREFIXES[matchedKey] : "C",
        groupBySubcategory: false,
    };
}

/**
 * Builds the URL for the SMS page's "Bumalik - Cancel" button.
 *
 * @remarks
 * Routing logic:
 * - Consultation: returns to cubicle selection (only consultation uses cubicles).
 * - OPD Screening: returns to unified age category selection (cubicles are bypassed).
 * - Other direct services: returns to the main kiosk services menu.
 *
 * @param service - The active service record.
 * @param patientType - The `type` query param ("new" | "old"), if present.
 * @param subcategory - The Adult/Pedia category, if one was chosen.
 * @returns The relative URL for the Cancel button's `href`.
 */
function buildCancelHref(
    service: Service | undefined,
    patientType: string | null,
    subcategory: string | undefined
): string {
    const serviceName = service?.label_en?.trim().toLowerCase();
    const serviceId = service?.id;

    // Consultation uses cubicles, so backing returns to cubicle selection
    if (serviceName === "consultation") {
        const params = new URLSearchParams();
        if (serviceId !== undefined) params.set("serviceId", String(serviceId));
        if (patientType) params.set("type", patientType);
        if (subcategory) params.set("subcategory", subcategory);
        return `/kiosk/pages/kiosk-cubicle-selection?${params.toString()}`;
    }

    // OPD Screening (and any service with an Adult/Pedia age category) bypasses cubicles
    // and returns directly to category selection
    if (
        serviceName === "opd screening" ||
        serviceName === "opd-screening" ||
        serviceName === "opdscreening" ||
        Boolean(subcategory)
    ) {
        const params = new URLSearchParams();
        if (serviceId !== undefined) params.set("serviceId", String(serviceId));
        if (patientType) params.set("type", patientType);
        if (service?.label_en) params.set("serviceLabel", service.label_en);
        return `/kiosk/pages/category-selection?${params.toString()}`;
    }

    // All other direct services return to the main kiosk services menu
    return patientType
        ? `/kiosk/pages/kiosk-services?type=${encodeURIComponent(patientType)}`
        : "/kiosk/pages/kiosk-services";
}

/**
 * Interactive phone entry controller coordinating keypad input, formatting,
 * Philippine mobile number validation, and database ticket creation via Supabase RPC (`create_patient`).
 *
 * @param props - Component props.
 * @returns The complete phone number input layout with keypad and action triggers.
 */
export default function KioskPhoneEntry({
    service,
    patientNum: initialPatientNum,
    preferredCubicleNums,
    subcategory,
    cubicleNum,
}: KioskPhoneEntryProps) {
    const preferredList = preferredCubicleNums ? preferredCubicleNums.split(",") : null;
    const [phone, setPhone] = useState("");
    const [inputWarning, setInputWarning] = useState<{ fil: string; en: string } | null>(null);
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [patientNum, setPatientNum] = useState<string | undefined>(initialPatientNum);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showLoading, hideLoading } = useKioskLoading();

    const patientType = searchParams.get("type");
    const cancelHref = buildCancelHref(service, patientType, subcategory);

    const resolvedCubicleParam =
        cubicleNum ||
        searchParams.get("cubicleNum") ||
        (preferredCubicleNums ? preferredCubicleNums.split(",")[0] : undefined);

    /**
     * Constructs the destination URL for the queue ticket printing screen with all metadata.
     *
     * @param generatedPatientNum - The assigned patient ticket code.
     * @returns The relative route path with query parameters.
     */
    const buildQueuePrintUrl = (generatedPatientNum: string): string => {
        const params = new URLSearchParams();
        params.set("patientNum", generatedPatientNum);
        params.set("serviceId", String(service.id));
        if (resolvedCubicleParam) {
            params.set("cubicleNum", resolvedCubicleParam);
        }
        return `/kiosk/pages/queue-print?${params.toString()}`;
    };

    const addDigit = (digit: string) => {
        const nextVal = getNextPhoneValue(phone, digit);
        if (nextVal !== null) {
            setPhone(nextVal);
            setInputWarning(null);
        } else if (phone.length === 0 || phone.length === 1) {
            // Display guidance when the patient taps a non-09 starting digit
            setInputWarning({
                fil: SMSValidationTexts.mustStartWith09Fil,
                en: SMSValidationTexts.mustStartWith09En,
            });
        }
    };

    const deleteLast = () => {
        setPhone((p) => p.slice(0, -1));
        setInputWarning(null);
    };

    /**
     * Executes the `create_patient` stored procedure in Supabase.
     */
    const createPatient = async (phoneToSave: string | null): Promise<string> => {
        const { prefix, groupBySubcategory } = getPrefixInfo(service, subcategory);

        // Diagnostic: log the resolved prefix and exact service label before the RPC call
        // so any future prefix mismatch is immediately visible in the console.
        console.log(`${getTimestamp()} [DB RPC] create_patient args:`, {
            label_en: service.label_en,
            prefix,
            subcategory: subcategory ?? null,
            groupBySubcategory,
        });

        const encryptedPhone = phoneToSave
            ? await encryptPatientPhoneAction(phoneToSave)
            : null;

        const t0 = performance.now();
        let { data, error } = await supabase.rpc("create_patient", {
            p_service: service.label_en,
            p_subcategory: subcategory ?? null,
            p_preferred_cubicles: preferredList,
            p_prefix: prefix,
            p_group_by_subcategory: groupBySubcategory,
            p_phone: encryptedPhone,
        });

        // Graceful fallback if database column or RPC is still defined as bigint
        if (error && (error.code === "22P02" || error.message?.includes("bigint"))) {
            console.warn(
                `${getTimestamp()} [PHONE SECURITY] Database p_phone parameter expects bigint. Fallback to standard digits. Run docs/migrations/encrypt_phone_number.sql in Supabase to enable encrypted phone storage.`
            );
            const fallbackRes = await supabase.rpc("create_patient", {
                p_service: service.label_en,
                p_subcategory: subcategory ?? null,
                p_preferred_cubicles: preferredList,
                p_prefix: prefix,
                p_group_by_subcategory: groupBySubcategory,
                p_phone: phoneToSave,
            });
            data = fallbackRes.data;
            error = fallbackRes.error;
        }
        const elapsed = Math.round(performance.now() - t0);

        if (error) {
            // Supabase PostgrestError has non-enumerable properties; wrap it in a
            // native Error so the full context is always visible in catch blocks.
            const pgError = new Error(
                error.message ?? "Supabase RPC error"
            ) as Error & { code?: string; details?: string; hint?: string };
            pgError.code = error.code;
            pgError.details = error.details;
            pgError.hint = error.hint;
            throw pgError;
        }
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
     * Serializes any caught value into a loggable plain object.
     *
     * @remarks
     * Supabase's PostgrestError defines its properties as non-enumerable and
     * implements a toJSON() that returns {}. Using Object.getOwnPropertyNames
     * bypasses toJSON() and captures every own property regardless of enumerability.
     * The raw value is also logged directly so it remains inspectable in DevTools
     * even when manual extraction is incomplete.
     *
     * @param e - The caught value from a try/catch block.
     * @returns A plain, serializable object with all available error fields.
     */
    const serializeError = (e: unknown): Record<string, unknown> => {
        if (e == null) return { message: String(e) };

        // Collect all own property names, including non-enumerable ones,
        // to circumvent toJSON() overrides that hide the real error data.
        const allKeys = Object.getOwnPropertyNames(e as object);
        const extracted: Record<string, unknown> = {};
        for (const key of allKeys) {
            try {
                extracted[key] = (e as Record<string, unknown>)[key];
            } catch {
                extracted[key] = "[unreadable]";
            }
        }

        // Always guarantee a message field as a final fallback.
        if (!extracted["message"]) {
            extracted["message"] = String(e);
        }

        return extracted;
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
            router.push(buildQueuePrintUrl(finalPatientNum));
        } catch (e) {
            hideLoading();
            console.error(`${getTimestamp()} [SMS CONTINUE ERROR] raw:`, e);
            console.error(`${getTimestamp()} [SMS CONTINUE ERROR]`, serializeError(e));
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
            router.push(buildQueuePrintUrl(finalPatientNum));
        } catch (e) {
            hideLoading();
            console.error(`${getTimestamp()} [SMS SKIP ERROR] raw:`, e);
            console.error(`${getTimestamp()} [SMS SKIP ERROR]`, serializeError(e));
        }
    };

    const validation = validatePhMobileNumber(phone);
    const isComplete = phone.length === SMS_PHONE_MAX_LENGTH;

    let errorMessageFil: string | undefined;
    let errorMessageEn: string | undefined;

    if (inputWarning) {
        errorMessageFil = inputWarning.fil;
        errorMessageEn = inputWarning.en;
    } else if (isComplete && !validation.isValid && validation.errorReason) {
        const err = SMSValidationTexts.errors[validation.errorReason];
        errorMessageFil = err.fil;
        errorMessageEn = err.en;
    }

    return (
        <div style={SMSLayoutStyle.contentWrapper} className={SMSLayoutClasses.contentWrapper}>
            <SMSHeader service={service} subcategory={subcategory} />

            {/* Entry Grid (Left: Phone & Actions, Right: NumPad) */}
            <div className={SMSLayoutClasses.entryGrid}>
                {/* Left Column (Landscape): Instructions, Phone Display & Actions */}
                <div className={SMSLayoutClasses.entryLeftCol}>
                    <div className={SMSLayoutClasses.phoneInputWrapper}>
                        <PhoneInput
                            phone={phone}
                            onDelete={deleteLast}
                            service={service}
                            isValid={validation.isValid}
                            errorMessageFil={errorMessageFil}
                            errorMessageEn={errorMessageEn}
                        />
                    </div>

                    <div className={SMSLayoutClasses.instructionWrapper}>
                        <SMSInstruction />
                    </div>

                    <div className={SMSLayoutClasses.continueWrapper}>
                        <ContinueButton
                            disabled={!validation.isValid}
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

                {/* Right Column: Keypad */}
                <div className={SMSLayoutClasses.entryRightCol}>
                    <NumPad onDigit={addDigit} />
                </div>
            </div>
        </div>
    );
}