"use client";

import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { useEffect, useState } from "react";

export const metadata: Metadata = {
  title: "Qaadi Live",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState(
    typeof navigator !== "undefined" ? navigator.language.split("-")[0] : ""
  );
  const [dir, setDir] = useState<"ltr" | "rtl" | "">(
    typeof navigator !== "undefined"
      ? navigator.language.startsWith("ar")
        ? "rtl"
        : "ltr"
      : ""
  );

  useEffect(() => {
    try {
      const l = localStorage.getItem("lang");
      const d = localStorage.getItem("dir");
      if (l) setLang(l);
      else setLang("en");
      if (d === "rtl" || d === "ltr") setDir(d as "rtl" | "ltr");
      else setDir("ltr");
    } catch {
      setLang("en");
      setDir("ltr");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <html lang={lang} dir={dir}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111111" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Script id="sw-register" strategy="afterInteractive">
          {`
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  `}
        </Script>
      </head>
      <body>
        <div className="wrapper">{children}</div>
      </body>
    </html>
  );
}
