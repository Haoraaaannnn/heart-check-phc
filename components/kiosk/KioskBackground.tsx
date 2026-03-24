
export default function KioskBackground({children}: {children? : React.ReactNode}){
    return(
        <div className="relative min-h-screen overflow-hidden bg-[#FFE4E6]">
            <div className="absolute inset-0 z-0"
            style={{
                backgroundImage: `radial-gradient(circle, #c4a0a0 3px, transparent 1px)`,
                backgroundSize: "64px 64px",
                opacity: 0.3
            }}>
            </div>
            <div className="absolute -top-20 -right-20 w-125 h-125 rounded-full bg-[#f0b8b0] opacity-75"/>
            <div className="absolute top-1/3 -left-45 w-150 h-150 rounded-full bg-[#f0b8b0] opacity-65"/>
            <div className="absolute -bottom-40 left-140 w-100 h-100 rounded-full bg-[#d9c0c5] opacity-70"/>
            <div className="relative z-10 flex flex-col min-h-screen">
                {children}
            </div>
        </div>
    );
}