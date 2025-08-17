"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

type Lang = "en" | "ar";

const translations: Record<Lang, Record<string, string>> = { en, ar };

interface LangContext {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LangContext>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LangDirProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "ar" || stored === "en") setLang(stored);
      else if (typeof navigator !== "undefined") {
        const nav = navigator.language.split("-")[0];
        setLang(nav === "ar" ? "ar" : "en");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem("lang", lang);
      localStorage.setItem("dir", dir);
    } catch {}
  }, [lang]);

  const t = (key: string) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
