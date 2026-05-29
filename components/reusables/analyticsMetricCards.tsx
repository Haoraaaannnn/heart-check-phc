import { darkTheme, lightTheme } from "@/constants/themes";

export default function AnalyticsMetricCards ({children, className}: {children?: React.ReactNode; className?: string}){
    return(
        <div className={`p-6 ${lightTheme} ${darkTheme} ${className}`}>
            {children}
        </div>
    )
}