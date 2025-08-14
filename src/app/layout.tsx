"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import { LanguageContext, Language } from "../context/LanguageContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "ar" || stored === "en") {
      setLang(stored);
    }
  }, []);

  const setLanguage = (language: Language) => {
    setLang(language);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", language);
    }
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Qaadi Live</title>
        <meta name="theme-color" content="#111111" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }
})();`
          }}
        />
      </head>
      <body>
        <LanguageContext.Provider value={{ lang, dir, setLanguage }}>
          <div className="wrapper">{children}</div>
        </LanguageContext.Provider>
      </body>
    </html>
  );
}
