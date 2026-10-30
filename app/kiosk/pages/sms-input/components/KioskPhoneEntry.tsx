"use client";

/** @fileoverview Kiosk mobile entry, encrypted check-in and actionable creation feedback. */
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Service } from "@/types/Services";
import { useKioskLoading } from "@/app/kiosk/context/KioskLoadingContext";
import PhoneInput from "@/app/kiosk/pages/sms-input/components/PhoneInput";
import NumPad from "@/app/kiosk/pages/sms-input/components/NumPad";
import ContinueButton from "@/app/kiosk/pages/sms-input/components/ContinueButton";
import SMSInstruction from "@/app/kiosk/pages/sms-input/components/SMSInstruction";
import SMSHeader from "@/app/kiosk/pages/sms-input/components/SMSHeader";
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
import { createKioskPatient, KioskTicketError } from "@/app/kiosk/pages/sms-input/utils/createKioskPatient";
import { useWebPrinter } from "@/app/kiosk/hooks/useWebPrinter";
import { requiresDoctorSelection } from '@/app/kiosk/lib/doctorSelection';

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
 * Resolves the queue ticket prefix asynchronously, prioritizing any custom
 * `queue_prefix_map` configured in the `app_settings` database table.
 *
 * @param service - Active service record.
 * @param subcategory - Optional patient subcategory (e.g. Adult or Pedia).
 * @returns Object containing prefix string and subcategory grouping flag.
 */
async function resolvePrefixInfo(
    service: Service,
    subcategory?: string
): Promise<{ prefix: string; groupBySubcategory: boolean }> {
    // 1. If service has an explicit queue_prefix defined in the PostgreSQL services table, prioritize it
    if (service.queue_prefix && service.queue_prefix.trim().length > 0) {
        return {
            prefix: service.queue_prefix.trim().toUpperCase(),
            groupBySubcategory: false,
        };
    }

    const fallback = getPrefixInfo(service, subcategory);
    try {
        const { data, error } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "queue_prefix_map")
            .maybeSingle();

        if (!error && data?.value) {
            const list = JSON.parse(data.value);
            if (Array.isArray(list)) {
                const nameLower = service.label_en?.trim().toLowerCase();
                const subLower = subcategory?.trim().toLowerCase();

                const matched = list.find((item: { service?: string; subcategory?: string | null; prefix?: string }) => {
                    const itemServiceLower = item.service?.trim().toLowerCase();
                    const itemSubLower = item.subcategory?.trim().toLowerCase() || null;
                    if (itemServiceLower !== nameLower) return false;
                    if (subLower) {
                        return itemSubLower === subLower;
                    }
                    return !itemSubLower;
                });

                if (matched && matched.prefix) {
                    return {
                        prefix: String(matched.prefix).trim(),
                        groupBySubcategory: fallback.groupBySubcategory,
                    };
                }
            }
        }
    } catch {
        console.warn('[PREFIX RESOLUTION] Using the default queue prefix.');
    }
    return fallback;
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
    const serviceId = service?.id;

    // 1. Services requiring cubicle selection back up to the cubicle selector
    if (requiresDoctorSelection(service)) {
        const params = new URLSearchParams();
        if (serviceId !== undefined) params.set("serviceId", String(serviceId));
        if (patientType) params.set("type", patientType);
        if (subcategory) params.set("subcategory", subcategory);
        return `/kiosk/pages/kiosk-cubicle-selection?${params.toString()}`;
    }

    // 2. Services prompting subcategories (or if a subcategory was chosen) back up to category selection
    if (service?.has_subcategories || Boolean(subcategory)) {
        const params = new URLSearchParams();
        if (serviceId !== undefined) params.set("serviceId", String(serviceId));
        if (patientType) params.set("type", patientType);
        if (service?.label_en) params.set("serviceLabel", service.label_en);
        return `/kiosk/pages/category-selection?${params.toString()}`;
    }

    // 3. All other direct services return to the main kiosk services menu
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
    const preferredList = requiresDoctorSelection(service) && preferredCubicleNums ? preferredCubicleNums.split(",") : null;
    const [phone, setPhone] = useState("");
    const [ticketError, setTicketError] = useState('');
    const creatingRef = useRef(false);
    const [inputWarning, setInputWarning] = useState<{ fil: string; en: string } | null>(null);
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);
    const [patientNum, setPatientNum] = useState<string | undefined>(initialPatientNum);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showLoading, hideLoading } = useKioskLoading();
    const { hardwareStatus } = useWebPrinter();

    const patientType = searchParams.get("type");
    const cancelHref = buildCancelHref(service, patientType, subcategory);

    const resolvedCubicleParam = requiresDoctorSelection(service) ? (
        cubicleNum ||
        searchParams.get("cubicleNum") ||
        (preferredCubicleNums ? preferredCubicleNums.split(",")[0] : undefined)) : undefined;

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
        const { prefix, groupBySubcategory } = await resolvePrefixInfo(service, subcategory);
        return createKioskPatient({ service: service.label_en, subcategory: subcategory ?? null,
            preferredCubicles: preferredList, prefix, groupBySubcategory, phone: phoneToSave });
    };

    /**
     * Handles patient confirmation of phone number and transitions to ticket printing.
     */
    const handleContinueConfirm = async () => {
        if (creatingRef.current) return;
        creatingRef.current = true;
        setTicketError('');
        setShowContinueModal(false);
        showLoading("Creating queue ticket...");
        try {
            const finalPatientNum = patientNum ?? (await createPatient(phone));
            setPatientNum(finalPatientNum);
            router.push(buildQueuePrintUrl(finalPatientNum));
        } catch (e: unknown) {
            hideLoading();
            creatingRef.current = false;
            setTicketError(e instanceof KioskTicketError ? e.message : 'Unable to create your queue ticket. Please try again or contact staff.');
        }
    };

    /**
     * Handles skipping phone entry and transitions to ticket printing.
     */
    const handleSkipConfirm = async () => {
        if (creatingRef.current) return;
        creatingRef.current = true;
        setTicketError('');
        setShowSkipModal(false);
        showLoading("Creating queue ticket...");
        try {
            const finalPatientNum = patientNum ?? (await createPatient(null));
            setPatientNum(finalPatientNum);
            router.push(buildQueuePrintUrl(finalPatientNum));
        } catch (e: unknown) {
            hideLoading();
            creatingRef.current = false;
            setTicketError(e instanceof KioskTicketError ? e.message : 'Unable to create your queue ticket. Please try again or contact staff.');
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
            {ticketError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 whitespace-normal">{ticketError}</p>}

            {/* Two-Column Entry Layout: Notice & Phone on Left, NumPad & Buttons on Right (stacked in portrait) */}
            <div className={SMSLayoutClasses.entryGrid}>
                {/* Left Column: Notice card + Phone input field */}
                <div className={SMSLayoutClasses.leftCol}>
                    <div className={SMSLayoutClasses.instructionWrapper}>
                        <SMSInstruction isFallbackMode={!hardwareStatus.canPrintPhysical} />
                    </div>

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
                </div>

                {/* Right Column: NumPad + Action Buttons */}
                <div className={SMSLayoutClasses.rightCol}>
                    <NumPad onDigit={addDigit} />

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
            </div>
        </div>
    );
}
