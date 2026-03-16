export default function UnviBackground({children}: {children?: React.ReactNode}){
    return(
        <div className="relative min-h-screen overflow-hidden bg-[#ffffff] items-center">
            {children}
        </div>
    );
}