export default function UnviBackground({children}: {children?: React.ReactNode}){
    return(
        <div className="min-h-screen overflow-hidden bg-white items-center justify-center flex flex-col">
            {children}
        </div>
    );
}