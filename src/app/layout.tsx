"use client";

import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { useEffect, useState } from "react";

export const metadata: Metadata = {
  title: "Qaadi Live",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("lang") ?? "ar";
    } catch {
      return "ar";
    }
  });
  const [dir, setDir] = useState<"ltr" | "rtl">(() => {
    try {
      const d = localStorage.getItem("dir");
      if (d === "rtl" || d === "ltr") return d;
    } catch {}
    return "rtl";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <html lang={lang} dir={dir}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f1115" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Script id="init-lang-dir" strategy="beforeInteractive">
          {`
    try {
      const l = localStorage.getItem('lang');
      const d = localStorage.getItem('dir');
      if (l) document.documentElement.lang = l;
      if (d === 'rtl' || d === 'ltr') document.documentElement.dir = d;
    } catch {}
  `}
        </Script>
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
