'use client';

import React, { createContext, useContext, useState, ReactNode } from "react";
import { languages } from "@/app/language";

type LanguageKey = keyof typeof languages;

interface LanguageContextType {
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => void;
  t: typeof languages.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageKey>("en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: languages[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}