import { lightTheme, darkTheme } from '@/constants/themes';

export default function ServiceMetricCard({children, className}: {children?: React.ReactNode; className?: string}){
    return(
        <div className={`p-6 flex flex-col justify-between ${lightTheme} ${darkTheme} ${className}`}>
            {children}
        </div>
    )
}