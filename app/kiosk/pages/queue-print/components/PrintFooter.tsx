import { queuePrintTexts } from "@/app/kiosk/pages/queue-print/constants/queuePrintTexts";
import { PrintFooterStyle } from "@/app/kiosk/pages/queue-print/constants/queuePrint";

/**
 * Bottom guidance notice informing the patient that their ticket is printing.
 *
 * @returns The dual-language registration waiting instructions.
 */
export default function PrintFooter() {
    return (
        <div style={PrintFooterStyle.container}>
            <p style={PrintFooterStyle.noticeFil}>
                {queuePrintTexts.footerFil}
            </p>
            <p style={PrintFooterStyle.noticeEn}>
                {queuePrintTexts.footerEn}
            </p>
        </div>
    );
}