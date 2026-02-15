import { ReactNode } from "react";

interface ContainerProps{
    children: ReactNode;
    className?: string;
}

export default function BgCard ({children, className = ""}: ContainerProps) {
    return (
        <div className={`w-full max-w-8xl h-full bg-gray-200 rounded-4xl p-6 md:p-10 shadow-lg flex flex-col item-center justify-baseline gap-8 ${className}`}>
            {children}
        </div>
    );
}