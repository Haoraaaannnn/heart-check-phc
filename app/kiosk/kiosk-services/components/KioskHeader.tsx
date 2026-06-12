"use client";

import { useEffect, useState } from "react";

export default function KioskHeader(){
    const [time, setTime] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" , second: "2-digit"}));
            setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric"}));  
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval)
    }, []);

    return (
        <header className="relative z-10 mx-4 mt-4  px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span 
                    className="text-gray-800 font-black text-[50px] tracking-wide"
                    style={{ WebkitTextStroke: '1px #1f2937' }}
                >Heart Check</span>
                <span 
                    className="text-[#cc3535] font-black text-[50px] tracking-wide"
                    style={{ WebkitTextStroke: '1px #cc3535' }}
                >PHC</span>
            </div>
            <div className="text-right">
                <p className="text-2xl font-baloo font-black text-[68px] text-gray-800">{time}</p>
                <div className="bg-white drop-shadow-2xl rounded-[45px] px-3 py-1 w-fit ml-auto font-baloo font-black text-[28px] text-black">{date}</div>
            </div>
        </header>
    );

}