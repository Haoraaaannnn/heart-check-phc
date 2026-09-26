import { PrintFooterTexts } from "@/app/kiosk/pages/queue-print/constants/printFooterTexts";
import { PrintFooterStyle } from "@/app/kiosk/pages/queue-print/constants/printFooter";

/**
 * Bottom guidance notice informing the patient that their ticket is printing.
 *
 * @returns The dual-language registration waiting instructions.
 */
export default function PrintFooter() {
    return (
        <div style={PrintFooterStyle.container}>
            <p style={PrintFooterStyle.noticeFil}>
                {PrintFooterTexts.footerFil}
            </p>
            <p style={PrintFooterStyle.noticeEn}>
                {PrintFooterTexts.footerEn}
            </p>
        </div>
    );
}