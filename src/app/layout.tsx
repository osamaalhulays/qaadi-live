"use client";

import "./globals.css";
import { LangDirProvider, useLangDir } from "../lib/lang";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { lang, dir } = useLangDir();
  return (
    <html lang={lang} dir={dir}>
      <head>
        <meta charSet="utf-8" />
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
        <div className="wrapper">{children}</div>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangDirProvider>
      <LayoutInner>{children}</LayoutInner>
    </LangDirProvider>
  );
}
