import { createClient as createPlainClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-loser Supabase-Client für Build-Zeit (generateStaticParams,
 * Sitemap, Metadata-Funktionen ohne Request-Context).
 *
 * Nicht für authentifizierte Requests verwenden — der nutzt die
 * RLS-Anon-Policy.
 *
 * Resilient gegen fehlende Env-Variablen: gibt null zurueck statt zu
 * werfen. Aufrufer (generateStaticParams etc.) handhaben das als
 * "keine statischen Pages, on-demand-rendering". Damit bleibt der
 * Build auch auf Preview-Environments gruen die nicht alle Secrets
 * gesetzt haben — die echten Seiten werden dann zur Request-Zeit
 * ueber den server-seitigen createClient gerendert (der wiederum
 * faellt durch wenn auch dort die Env fehlt, was sichtbarer ist).
 */
export function createStaticClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Build-Zeit-Log — keine Exception, sonst killt's den ganzen Build.
    if (typeof console !== "undefined") {
      console.warn(
        "[createStaticClient] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY fehlt — generateStaticParams liefert leer."
      );
    }
    return null;
  }
  return createPlainClient(url, key, { auth: { persistSession: false } });
}
