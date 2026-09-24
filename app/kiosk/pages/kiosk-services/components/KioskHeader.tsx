"use client";

import { useEffect, useState } from "react";
import { KioskHeaderStyle } from "@/app/kiosk/pages/kiosk-services/constants/kioskHeader";
import { KioskHeaderTexts } from "@/app/kiosk/pages/kiosk-services/constants/kioskHeaderTexts";
import KioskFooterWave from "@/app/kiosk/pages/kiosk-services/components/KioskFooterWave";

/**
 * Bottom bar of every kiosk screen.
 *
 * Although this component is named KioskHeader in the existing
 * codebase, it visually functions as the kiosk footer.
 *
 * The footer wave fills the entire container and the existing
 * brand/date/time content is rendered above the wave.
 */
export default function KioskHeader() {
    const [time, setTime] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        const update = () => {
            const now = new Date();

            setTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            );

            setDate(
                now.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })
            );
        };

        update();

        const interval = setInterval(update, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <header
            style={{
                ...KioskHeaderStyle.container,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <KioskFooterWave />

            <div
                style={{
                    ...KioskHeaderStyle.brand,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <span style={KioskHeaderStyle.brandPrimary}>
                    {KioskHeaderTexts.headerTitle}
                </span>

                <span style={KioskHeaderStyle.brandAccent}>
                    {KioskHeaderTexts.headerAccent}
                </span>
            </div>

            <div
                style={{
                    ...KioskHeaderStyle.clock,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <p style={KioskHeaderStyle.time}>{time}</p>

                <div style={KioskHeaderStyle.date}>
                    {date}
                </div>
            </div>
        </header>
    );
}