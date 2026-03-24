import { ReactNode } from "react";

export default function BgDisplay({children}: {children:ReactNode}){
    return(
        <div className ="w-screen h-screen bg-white md:py-10 md:px-10 flex flex-col items-center justify-center">
            {children}
        </div>
    );
}