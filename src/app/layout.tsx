"use client";

import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { useEffect, useState } from "react";

export const metadata: Metadata = {
  title: "Qaadi Live",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState("ar");
  const [dir, setDir] = useState<"ltr" | "rtl">("rtl");

  useEffect(() => {
    try {
      const l = localStorage.getItem("lang");
      const d = localStorage.getItem("dir");
      if (l) setLang(l);
      if (d === "rtl" || d === "ltr") setDir(d as "rtl" | "ltr");
    } catch {}
  }, []);

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
        <Script
          id="sw-register"
          strategy="afterInteractive"
          onLoad={() => {
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.register("/sw.js").catch(() => {});
            }
          }}
        />
      </head>
      <body>
        <div className="wrapper">{children}</div>
      </body>
    </html>
  );
}
