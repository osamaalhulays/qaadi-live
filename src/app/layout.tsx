import "./globals.css";
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Qaadi Live</title>
        <meta name="theme-color" content="#111111" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Script
          src="/sw.js"
          strategy="lazyOnload"
          onLoad={() => navigator.serviceWorker.register("/sw.js")}
        />
      </head>
      <body>
        <div className="wrapper">{children}</div>
      </body>
    </html>
  );
}
