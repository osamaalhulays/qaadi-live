import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
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
