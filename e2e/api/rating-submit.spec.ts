import { test, expect } from "@playwright/test";

test.describe("POST /api/rating/submit", () => {
  test("creates and upserts rating", async ({ request }) => {
    // Hole erst eine echte coffee_id via die Recommendation-Route.
    const recoRes = await request.get("/api/recommendation/next?surface=discovery_abo");
    expect(recoRes.status()).toBe(200);
    const reco = (await recoRes.json()) as { coffee: { id: string } };

    const body = {
      coffee_id: reco.coffee.id,
      stars: 5,
      positive_tags: ["nussig", "schokolade"],
      would_drink_again: "yes" as const,
    };

    // Insert (erste Bewertung)
    const res1 = await request.post("/api/rating/submit", { data: body });
    expect(res1.status()).toBe(200);
    const j1 = (await res1.json()) as { success: boolean; rating_id: string };
    expect(j1.success).toBe(true);
    expect(j1.rating_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4/i);

    // Upsert (gleiche customer+coffee -> selbe rating_id, Sterne aendern)
    const res2 = await request.post("/api/rating/submit", { data: { ...body, stars: 4 } });
    expect(res2.status()).toBe(200);
    const j2 = (await res2.json()) as { success: boolean; rating_id: string };
    expect(j2.rating_id).toBe(j1.rating_id);
  });

  test("400 invalid_body bei stars > 5", async ({ request }) => {
    const res = await request.post("/api/rating/submit", {
      data: {
        coffee_id: "00000000-0000-4000-8000-000000000000",
        stars: 99,
      },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid_body");
  });

  test("400 invalid_body bei nicht-UUID coffee_id", async ({ request }) => {
    const res = await request.post("/api/rating/submit", {
      data: { coffee_id: "not-a-uuid", stars: 4 },
    });
    expect(res.status()).toBe(400);
  });

  test("401 ohne Auth", async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
    const res = await ctx.post("/api/rating/submit", {
      data: { coffee_id: "00000000-0000-4000-8000-000000000000", stars: 4 },
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
