import { darkTheme } from "@/components/constants/darkTheme";

export default function MetricCards({children}: {children?: React.ReactNode}){
    return(
        <div className={`rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] border border-white/40 bg-white/35 p-6 w-full h-36 flex flex-col justify-between backdrop-blur-xl ${darkTheme}`}>
            {children}
        </div>
    )
}