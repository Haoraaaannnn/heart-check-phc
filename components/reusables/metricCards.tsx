import { darkTheme, lightTheme } from "@/constants/themes";

export default function MetricCards({children}: {children?: React.ReactNode}){
    return(
        <div className={`${lightTheme} p-6 w-full h-36 flex flex-col justify-between backdrop-blur-xl ${darkTheme}`}>
            {children}
        </div>
    )
}