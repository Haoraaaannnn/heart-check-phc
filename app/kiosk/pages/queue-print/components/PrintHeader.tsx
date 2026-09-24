import { queuePrintTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";
import { PrintHeaderStyle } from "@/app/kiosk/pages/queue-print/constants/queuePrint";

/**
 * Top acknowledgement header on the ticket printing completion screen.
 *
 * @returns The dual-language thank you banner.
 */
export default function PrintHeader() {
    return (
        <div style={PrintHeaderStyle.container}>
            <h1 style={PrintHeaderStyle.title}>
                {queuePrintTexts.headerFil}
            </h1>
            <p style={PrintHeaderStyle.subtitle}>
                {queuePrintTexts.headerEn}
            </p>
        </div>
    );
}