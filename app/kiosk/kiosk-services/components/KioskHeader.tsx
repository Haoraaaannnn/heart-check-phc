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
        <header className="relative z-10 px-4 py-4 flex items-center justify-between bg-[#7f0407]">
            <div className="flex items-center gap-3">
                <span 
                    className="text-white font-black text-[34px] ">Heart Check</span>
                <span 
                    className="text-[#ebb7b7] font-black text-[34px] ">PHC</span>
            </div>
            <div className="text-right">
                <p className="text-2xl text-[34px] text-white">{time}</p>
                <div className=" font-black text-[28px] text-white">{date}</div>
            </div>
        </header>
    );

}