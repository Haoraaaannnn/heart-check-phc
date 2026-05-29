import { textLight, textDark } from "@/constants/themes"

export default function AnalyticsMetricHeader ({children}: {children?: React.ReactNode}){
    return(
        <h2 className={`text-sm font-semibold uppercase ${textLight} ${textDark}`}>{children}</h2>
    )
}