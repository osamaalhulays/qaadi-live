"use client";

import { createContext, useContext } from "react";

export type Language = "ar" | "en";
export type LangContextType = {
  lang: Language;
  dir: "rtl" | "ltr";
  setLanguage: (lang: Language) => void;
};

export const LanguageContext = createContext<LangContextType>({
  lang: "ar",
  dir: "rtl",
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);
