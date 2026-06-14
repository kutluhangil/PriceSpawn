import type { Metadata, Viewport } from "next";
import { Sora, Onest } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";
import { BottomNav } from "@/components/bottom-nav";
import { CookieConsent } from "@/components/cookie-consent";
import { InstallPrompt } from "@/components/install-prompt";
import { ConstellationBg } from "@/components/constellation-bg";
import { SITE_NAME, SITE_SHORT, SITE_URL } from "@/lib/site";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — Oyun Fiyat Karşılaştırma`,
  description:
    "Türkiye'deki tüm oyun mağazalarını karşılaştır: Steam, Epic, Xbox, PlayStation, GOG ve daha fazlası. Hangi oyun nerede daha ucuz, TL olarak gör.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    title: `${SITE_NAME} — Oyun Fiyat Karşılaştırma`,
    description:
      "Steam, Epic, Xbox, PlayStation ve daha fazlasında TL fiyatlarını karşılaştır.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE_SHORT, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0c12" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f9" },
  ],
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_SHORT,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-192.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "tr-TR",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
  ],
};

const themeInit = `(function(){try{var p=localStorage.getItem("pricespawn-theme")||localStorage.getItem("hdu-theme")||"system";var t=(p==="system"||!p)?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;document.documentElement.dataset.theme=t;var l=localStorage.getItem("hdu-locale");if(l)document.documentElement.lang=l;}catch(e){}})();`;

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
      className={`${sora.variable} ${onest.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://shared.fastly.steamstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://shared.akamai.steamstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://shared.fastly.steamstatic.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <div className="app-bg" aria-hidden="true" />
        <ConstellationBg />
        <Providers>
          <Navbar />
          <main className="flex-1 pb-16 sm:pb-0">{children}</main>
          <Footer />
          <CommandPalette />
          <BottomNav />
          <CookieConsent />
          <InstallPrompt />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
