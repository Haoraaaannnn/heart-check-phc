import { queuePrintTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";

/**
 * Bottom guidance notice informing the patient that their ticket is printing.
 *
 * @returns The dual-language registration waiting instructions.
 */
export default function PrintFooter() {
    return (
        <div className="flex flex-col items-center justify-center w-full flex-shrink-0 px-4 py-3 sm:py-4 text-center">
            <p className="font-black text-sm sm:text-base md:text-xl text-gray-900 leading-tight">
                {queuePrintTexts.footerFil}
            </p>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-bold mt-1 leading-tight">
                {queuePrintTexts.footerEn}
            </p>
        </div>
    );
}