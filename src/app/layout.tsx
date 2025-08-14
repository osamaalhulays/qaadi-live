import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qaadi Live",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('lang');if(l)document.documentElement.lang=l;var d=localStorage.getItem('dir');if(d)document.documentElement.dir=d;}catch(e){}`
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
