export default function DashboardBG({children}:{children?: React.ReactNode}){
    return(
        <div className="flex min-h-screen bg-[#FFB1B1]">
            {children}
        </div>
    );
}