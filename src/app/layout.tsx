import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qaadi Studio",
  description: "نصوص توليدية للأهداف المختلفة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head />
      <body>
        <main className="wrapper">{children}</main>
      </body>
    </html>
  );
}
