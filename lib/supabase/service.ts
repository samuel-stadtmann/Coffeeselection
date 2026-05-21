import { createClient } from "@supabase/supabase-js";

/**
 * Service-Role Supabase-Client. NUR auf dem Server verwenden — der
 * SUPABASE_SERVICE_ROLE_KEY umgeht ALLE RLS-Policies. Niemals an den
 * Browser ausliefern.
 *
 * Use-Cases:
 *   - Admin-Pages die View-Daten lesen (z.B. /admin/metrics)
 *   - Server-seitige Workers / Cron-Routes
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createServiceClient: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
