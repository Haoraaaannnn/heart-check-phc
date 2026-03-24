export default function DashboardBG({children}:{children?: React.ReactNode}){
    return(
        <div className="flex min-h-screen bg-red-200">
            {children}
        </div>
    );
}