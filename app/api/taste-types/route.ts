import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTasteTypes } from "@/lib/db/taste-types";

// GET /api/taste-types
//   Liefert alle aktiven Geschmackstypen aus der DB. Wird von Client-
//   Komponenten genutzt (match-result, dashboard) — Server-Komponenten
//   rufen lib/db/taste-types direkt auf.
//
// Caching: taste_types aendert sich selten. 1 Stunde public-Cache.

export async function GET() {
  const supabase = await createClient();
  const types = await getTasteTypes(supabase);
  return NextResponse.json(
    { types },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
