export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Qaadi Live</title>
      </head>
      <body style={{ margin: 16, fontFamily: "system-ui, Arial, sans-serif", lineHeight: 1.5 }}>
        {children}
      </body>
    </html>
  );
}
