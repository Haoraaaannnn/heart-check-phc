"use client";

import { usePathname } from "next/navigation";

/** Step descriptor definition for kiosk patient journey. */
interface KioskStep {
    /** 1-based sequential step index. */
    id: number;
    /** Primary Filipino step label. */
    labelFil: string;
    /** English secondary step label. */
    labelEn: string;
}

/** The 4 standardized patient journey steps for kiosk check-in. */
const KIOSK_JOURNEY_STEPS: readonly KioskStep[] = [
    { id: 1, labelFil: "Kategorya", labelEn: "Category" },
    { id: 2, labelFil: "Serbisyo", labelEn: "Service" },
    { id: 3, labelFil: "Detalye", labelEn: "Details" },
    { id: 4, labelFil: "Tiket", labelEn: "Ticket" },
] as const;

/**
 * Visual step progression bar for the self-service kiosk check-in flow.
 *
 * @remarks
 * Dynamically computes the active step from the current URL pathname:
 * - Step 1: `/kiosk/pages/kiosk-new-old-selection`
 * - Step 2: `/kiosk/pages/kiosk-services`
 * - Step 3: `/kiosk/pages/category-selection`, `/kiosk/pages/kiosk-cubicle-selection`, `/kiosk/pages/sms-input`
 * - Step 4: `/kiosk/pages/confirmation`, `/kiosk/pages/queue-print`
 *
 * Designed with enterprise solid surfaces, high-contrast typography, and zero emojis.
 *
 * @returns The step progress navigation tracker.
 */
export default function KioskStepProgress() {
    const pathname = usePathname();

    // Determine current step index
    let currentStep = 1;
    if (pathname.includes("kiosk-new-old-selection")) {
        currentStep = 1;
    } else if (pathname.includes("kiosk-services")) {
        currentStep = 2;
    } else if (
        pathname.includes("category-selection") ||
        pathname.includes("kiosk-cubicle-selection") ||
        pathname.includes("sms-input")
    ) {
        currentStep = 3;
    } else if (
        pathname.includes("confirmation") ||
        pathname.includes("queue-print")
    ) {
        currentStep = 4;
    }

    return (
        <nav
            aria-label="Kiosk check-in journey steps"
            className="w-full max-w-[640px] sm:max-w-[760px] md:max-w-[880px] lg:max-w-[960px] py-1 px-2 bg-transparent border-0 shadow-none select-none"
        >
            <div className="relative w-full">
                {/* 1. Continuous Background Track Line */}
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        left: "12.5%",
                        right: "12.5%",
                        height: 3.5,
                        backgroundColor: "#CBD5E1",
                        zIndex: 1,
                        borderRadius: 9999,
                    }}
                />

                {/* 2. Animated Completed Progress Line */}
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        left: "12.5%",
                        width: `${((currentStep - 1) / (KIOSK_JOURNEY_STEPS.length - 1)) * 75}%`,
                        height: 3.5,
                        backgroundColor: "#16A34A",
                        zIndex: 2,
                        borderRadius: 9999,
                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />

                {/* 3. Step Nodes & Labels Row */}
                <div className="relative z-10 flex items-start justify-between w-full">
                    {KIOSK_JOURNEY_STEPS.map((step) => {
                        const isCurrent = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <div
                                key={step.id}
                                className="flex-1 flex flex-col items-center px-1"
                            >
                                {/* Node Indicator directly intersecting the track line */}
                                <div className="flex items-center justify-center h-9">
                                    {isCompleted ? (
                                        <div
                                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xs transition-transform duration-200"
                                            style={{
                                                backgroundColor: "#16A34A",
                                                color: "#FFFFFF",
                                            }}
                                        >
                                            <i
                                                className="bx bx-check text-lg sm:text-xl font-black"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    ) : isCurrent ? (
                                        /* Concentric Target Bullseye Node (Faithful to Reference Image) */
                                        <div
                                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xs ring-4 ring-red-100 transition-all duration-300"
                                            style={{
                                                border: "2.5px solid #C9142B",
                                                backgroundColor: "#FEF2F2",
                                            }}
                                        >
                                            <div
                                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full animate-pulse"
                                                style={{
                                                    backgroundColor: "#C9142B",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        /* Upcoming Step Node (Hollow subtle circle) */
                                        <div
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                                            style={{
                                                border: "2px solid #CBD5E1",
                                                backgroundColor: "#FFFFFF",
                                            }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{
                                                    backgroundColor: "#CBD5E1",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Two-Line Labels Below Node with generous spacing */}
                                <div className="mt-1.5 text-center flex flex-col items-center">
                                    <span
                                        className="text-xs sm:text-sm md:text-base whitespace-nowrap leading-tight transition-colors duration-200"
                                        style={{
                                            fontWeight: isCurrent
                                                ? 900
                                                : isCompleted
                                                    ? 800
                                                    : 600,
                                            color: isCurrent
                                                ? "#C9142B"
                                                : isCompleted
                                                    ? "#0F172A"
                                                    : "#94A3B8",
                                        }}
                                    >
                                        {step.labelFil}
                                    </span>
                                    <span
                                        className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap leading-tight transition-colors duration-200 mt-0.5"
                                        style={{
                                            fontWeight: isCurrent ? 700 : 500,
                                            color: isCurrent
                                                ? "#991B1B"
                                                : isCompleted
                                                    ? "#64748B"
                                                    : "#CBD5E1",
                                        }}
                                    >
                                        {step.labelEn}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
