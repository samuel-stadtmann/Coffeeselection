import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/auth";
import { refreshAdminReauthCookie } from "@/lib/admin/reauth";
import { createServiceClient } from "@/lib/supabase/service";

const CategoryEnum = z.enum([
  "social_media",
  "paid_ads",
  "influencer",
  "pr_editorial",
  "event_sponsoring",
  "print",
  "seo_content",
  "email_marketing",
  "other",
]);

const BodySchema = z.object({
  category: CategoryEnum,
  name: z.string().min(2).max(200),
  description: z.string().max(1000).nullable().optional(),
  budget_chf: z.number().min(0),
  spent_chf: z.number().min(0).default(0),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await refreshAdminReauthCookie())) {
    return NextResponse.json({ error: "reauth_required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details: parsed.error.issues.map((i) => i.message).join(", "),
      },
      { status: 400 }
    );
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("marketing_spend")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: data?.id });
}
