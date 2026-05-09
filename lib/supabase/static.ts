import { createClient as createPlainClient } from "@supabase/supabase-js";

/**
 * Cookie-loser Supabase-Client für Build-Zeit (generateStaticParams,
 * Sitemap, Metadata-Funktionen ohne Request-Context).
 *
 * Nicht für authentifizierte Requests verwenden — der nutzt RLS-Anon-Policy.
 */
export function createStaticClient() {
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
