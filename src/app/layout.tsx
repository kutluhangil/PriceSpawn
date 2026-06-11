import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SITE_NAME} — Oyun Fiyat Karşılaştırma`,
  description:
    "Türkiye'deki tüm oyun mağazalarını karşılaştır: Steam, Epic, Xbox, PlayStation, GOG ve daha fazlası. Hangi oyun nerede daha ucuz, TL olarak gör.",
};

const themeInit = `(function(){try{var t=localStorage.getItem("hdu-theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;var l=localStorage.getItem("hdu-locale");if(l)document.documentElement.lang=l;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <div className="mesh" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
