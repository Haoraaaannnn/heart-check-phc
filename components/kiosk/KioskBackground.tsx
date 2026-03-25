export default function KioskBackground({children}: {children? : React.ReactNode}){
    return(
        <div className="relative w-full h-full">
            <div className="absolute -top-20 -right-20 w-125 h-125 rounded-full bg-[#f0b8b0] opacity-75"/>
            <div className="absolute top-1/3 -left-45 w-150 h-150 rounded-full bg-[#f0b8b0] opacity-65"/>
            <div className="absolute -bottom-40 left-140 w-100 h-100 rounded-full bg-[#d9c0c5] opacity-70"/>
            
            <div className="relative z-10 flex flex-col h-full w-full">
                {children}
            </div>
        </div>
    );
}