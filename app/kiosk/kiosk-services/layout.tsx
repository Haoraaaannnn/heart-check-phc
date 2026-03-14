//! Di pa gumagana language switcher
//* Nasa database lahat fonts and etc to be adjusted later

"use client";

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className=" bg-[#2B59FF] text-white text-center p-10 rounded-b-[50px] shadow-lg">
        <h1 className="text-4xl">Magandang Araw!</h1>
        <p>Pumili at pindutin ang serbisyong kailangan ninyo:</p>
      </header>
      <main>{children}</main>
      <footer className="bg-[#2B59FF] text-white text-center p-8 rounded-t-[50px] shadow-inner mt-auto"></footer>
    </div>
  );
}

/*interface ThemeConfig {
    primaryColor: string;
    borderRadius: string;
    headerPadding: string;
    titleSize: string;
}

interface translationMap {
    [key: string]: {
        en: string;
        fil: string;
    };
}

export default async function KioskLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    
    const { data: themes } = await supabase
        .from('kiosk_themes')
        .select('config')
        .eq('setting_id', 'main_theme')
        .single();
    
    const { data: translations } = await supabase
        .from('translations')
        .select('*');

    const t = translations?.reduce<translationMap>((acc, item) => {
        acc[item.key] = {en: item.en, fil: item.fil};
        return acc;
    },{})

    const config = themes?.config as unknown as ThemeConfig;

    return(
        <div 
        style= {{ backgroundColor: config?.primaryColor || '#FFFFFF', borderRadius: config?.borderRadius }}
        className="flex flex-col min-h-screen bg-white">
            <header className={`${config?.headerPadding} bg-[#2B59FF] text-white text-center p-10 rounded-b-[50px] shadow-lg`}>
                <h1 className={config?.titleSize}>{t?.greeting?.en}</h1>
                <p>{t?.instructions?.en}</p>
            </header>
            <main>{children}</main>
            <footer className="bg-[#2B59FF] text-white text-center p-8 rounded-t-[50px] shadow-inner mt-auto">
                <h2 className="text-3xl font-bold mb-4">
                    {t?.languageType?.en || 'Language:'}
                </h2>
                
                <div className="inline-flex bg-white rounded-full p-1 shadow-md">
                    <button className="px-8 py-2 text-[#2B59FF] font-bold text-xl rounded-full">
                        Filipino
                    </button>
                    <button className="px-8 py-2 bg-[#2B59FF] text-white font-bold text-xl rounded-full shadow-lg">
                        English
                    </button>
                </div>
            </footer>
        </div>
    );
}*/

// old source code for reference
/*'use client';

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
}*/
