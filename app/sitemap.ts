import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { cities } from "@/lib/cities";
import { comparisons } from "@/lib/comparisons";
import { articles } from "@/lib/articles";

/**
 * Site-Map fuer Google/Suchmaschinen. Statische Public-Routen + dynamisch
 * gepullte Coffee- und Roaster-Slugs aus der DB.
 *
 * NEXT_PUBLIC_SITE_URL muss gesetzt sein (Production: coffeeselection.ch,
 * Staging: staging.coffeeselection.ch). Fallback fuer lokale Builds.
 */

const TASTE_TYPE_SLUGS = [
  "der-klassiker",
  "der-fruchtfreund",
  "der-espresso-enthusiast",
  "der-entdecker",
  "der-sanfte",
  "der-florale",
  "der-erdige",
  "der-suesse",
];

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://coffeeselection.ch"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/coffee`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/taste-types`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/roasters`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/subscription/discovery`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/seo-city`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/quiz/question-1-brewing-method`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const tasteTypeRoutes: MetadataRoute.Sitemap = TASTE_TYPE_SLUGS.map((slug) => ({
    url: `${base}/taste-types/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cityRoutes: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${base}/seo-city/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const compareRoutes: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: `${base}/compare/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/learn/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Coffees + Roasters live aus DB. Best-effort: bei Fehler nur statische
  // Routen ausgeben, damit Build nicht crasht.
  let coffeeRoutes: MetadataRoute.Sitemap = [];
  let roasterRoutes: MetadataRoute.Sitemap = [];
  try {
    const svc = createServiceClient();
    const [{ data: coffeesData }, { data: roastersData }] = await Promise.all([
      svc
        .from("coffees")
        .select("slug, updated_at")
        .eq("status", "active")
        .is("deleted_at", null),
      svc
        .from("roasters")
        .select("slug, updated_at")
        .eq("status", "active")
        .is("deleted_at", null),
    ]);
    coffeeRoutes = ((coffeesData ?? []) as Array<{ slug: string; updated_at: string | null }>).map(
      (c) => ({
        url: `${base}/coffee/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );
    roasterRoutes = ((roastersData ?? []) as Array<{ slug: string; updated_at: string | null }>).map(
      (r) => ({
        url: `${base}/roasters/${r.slug}`,
        lastModified: r.updated_at ? new Date(r.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    );
  } catch (e) {
    console.error("[sitemap] DB-Pull fuer Coffees/Roasters fehlgeschlagen", e);
  }

  return [
    ...staticRoutes,
    ...tasteTypeRoutes,
    ...cityRoutes,
    ...compareRoutes,
    ...articleRoutes,
    ...coffeeRoutes,
    ...roasterRoutes,
  ];
}
