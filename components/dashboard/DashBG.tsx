export default function DashboardBG({children}:{children?: React.ReactNode}){
    return(
        <div className="flex min-h-screen bg-gradient-to-br from-[#fffdfd] via-[#fff5f5] to-[#ffeaea]">
            <div className="pointer-events-none absolute inset-0 z-0">

                <div className="absolute top-[-100px] right-[-100px] h-[450px] w-[450px] rounded-full bg-[#ff6b6b]/20 blur-[130px]" />

                <div className="absolute bottom-[-120px] left-[-80px] h-[400px] w-[400px] rounded-full bg-[#ff8a8a]/20 blur-[130px]" />

                <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd4d4]/30 blur-[160px]" />
            </div>
            {children}
        </div>
    );
}