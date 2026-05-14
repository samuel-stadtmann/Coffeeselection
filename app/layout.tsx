import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coffee Selection — Digital Sommelier",
  description:
    "Finde deinen perfekten Specialty Coffee. Kuratierte Schweizer Röstereien, maßgeschneidert für deinen Gaumen.",
};

// Viewport-Meta — Pflicht fuer Responsive. Ohne das ignorieren Mobile-
// Browser die Tailwind-Breakpoints und rendern die Desktop-Breite
// heruntergezoomt statt das Mobile-Layout zu nutzen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      </head>
      <body>{children}</body>
    </html>
  );
}
