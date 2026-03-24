//banner
//text instruction achuchu
//input & button (children)

import UnviBackground from "@/components/universal/background";


export default function SMSInput({children}: {children: React.ReactNode}){
    return(
        <UnviBackground>
            {children}
        </UnviBackground>
    );
}
