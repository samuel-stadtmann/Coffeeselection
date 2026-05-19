import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://coffeeselection.ch";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Coffee Selection — Digital Sommelier",
    template: "%s | Coffee Selection",
  },
  description:
    "Finde deinen perfekten Specialty Coffee. Kuratierte Schweizer Röstereien, maßgeschneidert für deinen Gaumen.",
  openGraph: {
    siteName: "Coffee Selection",
    locale: "de_CH",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/logo.png",
        alt: "Coffee Selection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@coffeeselection",
  },
};

// Viewport-Meta — Pflicht fuer Responsive. Ohne das ignorieren Mobile-
// Browser die Tailwind-Breakpoints und rendern die Desktop-Breite
// heruntergezoomt statt das Mobile-Layout zu nutzen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Schema.org Organization JSON-LD — globaler Eintrag, wird auf jeder Page
// in den <head> injected. Hilft Google die Marke korrekt zu verstehen
// (Knowledge Graph, Sitelinks). Erweiterung mit "sameAs"-URLs (Instagram,
// LinkedIn) wenn Social-Accounts live sind.
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Coffee Selection",
  alternateName: "Coffee Selection GmbH",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Schweizer Specialty Coffee Marktplatz mit kuratierter Auswahl und algorithmischem Geschmacksprofil-Matching.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "CH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSONLD),
          }}
        />
      </head>
      <body>
        {/* Google Analytics 4 — nur laden wenn NEXT_PUBLIC_GA_MEASUREMENT_ID
            gesetzt ist (verhindert leere gtag-Calls in Dev / Preview). */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  send_page_view: true,
                  // GA4: 'enhanced measurement' wird in der GA-UI aktiviert
                  // (Scrolls, Outbound-Clicks, Site-Search, File-Downloads).
                });
                window.gtag = gtag;
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
