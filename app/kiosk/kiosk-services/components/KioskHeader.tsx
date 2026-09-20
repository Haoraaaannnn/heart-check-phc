"use client";

import { useEffect, useState } from "react";
import { KioskHeaderStyle } from "@/app/kiosk/kiosk-services/constants/kioskHeader";

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
        <header style={KioskHeaderStyle.container}>
            <div style={KioskHeaderStyle.brand}>
                <span style={KioskHeaderStyle.brandPrimary}>Heart Check</span>
                <span style={KioskHeaderStyle.brandAccent}>PHC</span>
            </div>
            <div style={KioskHeaderStyle.clock}>
                <p style={KioskHeaderStyle.time}>{time}</p>
                <div style={KioskHeaderStyle.date}>{date}</div>
            </div>
        </header>
    );

}