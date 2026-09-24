import { queuePrintTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";

/**
 * Top acknowledgement header on the ticket printing completion screen.
 *
 * @returns The dual-language thank you banner.
 */
export default function PrintHeader() {
    return (
        <div className="flex flex-col items-center justify-center w-full flex-shrink-0 py-3 sm:py-4 px-4 text-center">
            <h1 className="font-black text-2xl sm:text-4xl md:text-5xl text-gray-900 leading-tight">
                {queuePrintTexts.headerFil}
            </h1>
            <p className="text-xl sm:text-3xl text-gray-700 font-bold mt-1">
                {queuePrintTexts.headerEn}
            </p>
        </div>
    );
}