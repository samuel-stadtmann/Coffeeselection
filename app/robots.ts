import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://coffeeselection.ch"
  );
}

/**
 * robots.txt — erlaubt Indexierung der Public-Pages, blockt Admin/Account/
 * Checkout/Roaster-Portal-Bereiche (interne Nutzer-Funktionen, gehoeren
 * nicht in den Google-Index).
 *
 * Auf staging.coffeeselection.ch bewusst gleicher Inhalt — wir setzen
 * dort `noindex` pro Page via metadata.robots oder via separater
 * Staging-Subdomain-Sperre. Falls staging-eigene Sperre gewuenscht:
 * NEXT_PUBLIC_DISALLOW_INDEXING=1 setzen → kompletter Disallow.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  if (process.env.NEXT_PUBLIC_DISALLOW_INDEXING === "1") {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${base}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/checkout",
          "/checkout/",
          "/roaster/login",
          "/roaster/dashboard",
          "/roaster/coffees",
          "/roaster/orders",
          "/api/",
          "/auth/",
          "/login",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
