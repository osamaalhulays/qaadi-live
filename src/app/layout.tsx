import "./globals.css";
import type { Metadata } from "next";
import LangDirProvider from "@/components/LangDirProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Qaadi Live",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f1115" />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <LangDirProvider>
          <ServiceWorkerRegister />
          <div className="wrapper">{children}</div>
        </LangDirProvider>
      </body>
    </html>
  );
}
