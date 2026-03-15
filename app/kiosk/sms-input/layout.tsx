//banner
//text instruction achuchu
//input & button (children)
//footer: privacy policies???

import SMSBanner from "@/components/kiosk-sms-input/sms-banner";
import UnviBackground from "@/components/universal/background";

export default function SMSInput({children}: {children: React.ReactNode}){
    return(
        <UnviBackground>
            <SMSBanner/>
            <main>{children}</main>
        </UnviBackground>
    );
}
