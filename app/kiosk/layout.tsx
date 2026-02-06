// learn use span and h1 and p
// TODO: Language selection buttons in the footer
// TODO: Learn language code switching

'use client';

import { useState } from "react";
import { languages } from "@/app/language";

type language = "en" | "fil";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
    const [language, setlanguage] = useState<language>('fil');
    const t = languages[language];
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <header className="bg-[#2B59FF] text-white text-center p-10 rounded-b-[50px] shadow-lg">
                <h1 className="text-4xl font-bold mb-2">{t.greeting}</h1>
                <p className="text-2xl">{t.instruction}</p>
            </header>
                    
            <main className="grow flex items-center justify-center p-10">
                {children}
            </main>

            <footer className="bg-[#2B59FF] text-white text-center p-8 rounded-t-[50px] flex flex-col items-center">
                <span className="text-xl font-bold mb-2">{t.languageType}</span>
                
            </footer>
        </div>
    );
}