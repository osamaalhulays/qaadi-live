"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LanguageContextType {
  lang: string;
  dir: "ltr" | "rtl";
  setLang: (lang: string) => void;
  setDir: (dir: "ltr" | "rtl") => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("ar");
  const [dir, setDir] = useState<"ltr" | "rtl">("rtl");

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, setDir }}>
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
