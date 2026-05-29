import { ReactNode } from "react";

export default function DisplayHeader ({children}: {children: ReactNode}){
    return(
        <h1 className="w-full max-w-8xl bg-white py-5 rounded-4xl shadow-2xl text-4xl font-bold text-black text-center">
            {children}
        </h1>
    );
}