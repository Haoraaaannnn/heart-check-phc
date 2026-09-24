"use client";

import { useEffect } from "react";
import { themeColors } from "@/constants/colors";

/** Props for {@link ConfirmationModal}. */
interface ConfirmationModalProps {
    /** Whether the modal is currently open and visible. */
    isOpen: boolean;
    /** English title line. */
    titleEng: string;
    /** Filipino primary title line. */
    titleFil: string;
    /** Filipino message prompt. */
    messageFil: string;
    /** English message translation. */
    messageEng: string;
    /** Optional confirmation button text (defaults to "Magpatuloy - Continue"). */
    confirmText?: string;
    /** Optional cancellation button text (defaults to "Bumalik - Cancel"). */
    cancelText?: string;
    /** Action triggered on confirming. */
    onConfirm: () => void;
    /** Action triggered on canceling/closing. */
    onCancel: () => void;
    /** Whether this action represents a destructive or skipping risk. */
    isDangerous?: boolean;
    /** The phone number to format and display for verification. */
    phone: string;
}

/**
 * Reusable modal dialog for verifying phone numbers and confirming skipped steps.
 *
 * @param props - Component props.
 * @returns The confirmation modal dialog.
 */
export default function ConfirmationModal({
    isOpen,
    phone,
    titleEng,
    titleFil,
    messageFil,
    messageEng,
    confirmText = "Magpatuloy - Continue",
    cancelText = "Bumalik - Cancel",
    onConfirm,
    onCancel,
    isDangerous: _isDangerous = false,
}: ConfirmationModalProps) {
    // Lock body scroll when open
    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    /**
     * Formats digits into standard Philippine mobile spacing (09XX XXX XXXX).
     */
    const formatPhone = (raw: string) => {
        const d = raw.replace(/\D/g, "");
        if (d.length <= 4) return d;
        if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
        return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 max-w-2xl w-full shadow-2xl flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Dual-language Title Header */}
                <div className="mb-6 text-center flex flex-col gap-1">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                        {titleFil}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-500 leading-tight">
                        {titleEng}
                    </span>
                </div>

                {/* Message and Phone Display Box */}
                <div className="w-full flex flex-col border-2 border-dashed border-gray-300 p-5 rounded-2xl mb-6 bg-gray-50/50 text-center">
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-900 leading-snug font-bold">
                        {messageFil}
                    </p>

                    <div className="h-[1px] w-full bg-gray-300 rounded my-3" />

                    <p className="text-base sm:text-lg text-gray-600 leading-snug font-normal">
                        {messageEng}
                    </p>

                    {phone && (
                        <p className="mt-3 text-2xl sm:text-3xl font-black tracking-wider text-black">
                            {formatPhone(phone)}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 w-full flex-col sm:flex-row">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-lg sm:text-xl bg-white border-2 border-gray-300 text-gray-700 transition-all active:scale-95 hover:bg-gray-100"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-lg sm:text-xl text-white transition-all active:scale-95 shadow-md hover:brightness-105"
                        style={{ backgroundColor: themeColors.brandRed }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
