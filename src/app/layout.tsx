export const metadata = { title: "Qaadi Live" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{margin:0, background:'#0b0b0c', color:'#e6e6e7', fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif'}}>
        {children}
      </body>
    </html>
  );
}
