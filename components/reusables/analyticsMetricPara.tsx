import { textDark, textLight } from "@/constants/themes";

export default function AnalyticsMetricPara ({children, className}: {children?: React.ReactNode; className?: string}){
    return(
        <p className={`text-3xl font-bold mt-2 ${textDark} ${textLight}`}>{children}</p>
    )
}