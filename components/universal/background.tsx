export default function UnviBackground({children}: {children?: React.ReactNode}){
    return(
        <div className="min-h-screen overflow-hidden bg-white flex flex-col">
            {children}
        </div>
    );
}