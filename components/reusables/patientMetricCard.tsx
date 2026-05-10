import { darkTheme, lightTheme } from "@/constants/themes";

export default function PatientMetricCard ({children, className}: {children?: React.ReactNode; className?: string}){
    return(
        <div className={`p-6 flex flex-col items-center justify-between ${lightTheme} ${darkTheme}`}>
            {children}
        </div>
    )
}