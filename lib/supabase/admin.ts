import { createClient } from "@supabase/supabase-js";

/**
 * Admin-Client mit Service-Role-Key. NIE im Client-Code verwenden — nur
 * für Server-Routes/Cron-Jobs/Edge-Functions, in denen RLS bewusst umgangen
 * wird (z.B. Background-Worker, die quer durch User-Daten arbeiten).
 *
 * Erfordert env-Var SUPABASE_SERVICE_ROLE_KEY (NICHT NEXT_PUBLIC_).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY env var missing");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
