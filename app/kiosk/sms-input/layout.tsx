//banner
//text instruction achuchu
//input & button (children)
//footer: privacy policies???

import SMSBanner from "@/components/SMS/sms-banner";
import UnviBackground from "@/components/universal/background";
import SMSInstruction from "@/components/SMS/sms-instruction";

export default function SMSInput({children}: {children: React.ReactNode}){
    return(
        <UnviBackground>
            <SMSBanner/>
            <SMSInstruction/>
            {children}
        </UnviBackground>
    );
}
