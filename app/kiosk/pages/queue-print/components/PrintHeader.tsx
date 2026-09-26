import { PrintHeaderTexts } from "@/app/kiosk/pages/queue-print/constants/printHeaderTexts";
import { PrintHeaderStyle } from "@/app/kiosk/pages/queue-print/constants/printHeader";

/**
 * Top acknowledgement header on the ticket printing completion screen.
 *
 * @returns The dual-language thank you banner.
 */
export default function PrintHeader() {
    return (
        <div style={PrintHeaderStyle.container}>
            <h1 style={PrintHeaderStyle.title}>
                {PrintHeaderTexts.headerFil}
            </h1>
            <p style={PrintHeaderStyle.subtitle}>
                {PrintHeaderTexts.headerEn}
            </p>
        </div>
    );
}