import { ReactNode } from "react";

interface ContainerProps {
    children: ReactNode;
    className?: string;
}

export default function BgDisplay({children, className = ""}: ContainerProps){
    return(
        <div className ={`w-screen h-screen bg-white md:py-10 md:px-10 flex flex-col items-center justify-center ${className}`}>
            {children}
        </div>
    );
}