"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type LangDirContextType = {
  lang: string;
  dir: "ltr" | "rtl";
  setLang: (lang: string) => void;
  setDir: (dir: "ltr" | "rtl") => void;
};

const LangDirContext = createContext<LangDirContextType>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  setDir: () => {}
});

export function LangDirProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("ar");
  const [dir, setDir] = useState<"ltr" | "rtl">("rtl");
  return (
    <LangDirContext.Provider value={{ lang, dir, setLang, setDir }}>
      {children}
    </LangDirContext.Provider>
  );
}

export function useLangDir() {
  return useContext(LangDirContext);
}

