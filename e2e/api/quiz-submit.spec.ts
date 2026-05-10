import { test, expect } from "@playwright/test";

test.describe("POST /api/quiz/submit", () => {
  test("400 invalid_body wenn answers fehlen", async ({ request }) => {
    const res = await request.post("/api/quiz/submit", { data: {} });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid_body");
  });

  test("400 invalid_body bei leerem answers-Array", async ({ request }) => {
    const res = await request.post("/api/quiz/submit", { data: { answers: [] } });
    expect(res.status()).toBe(400);
  });

  test("401 ohne Auth", async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
    const res = await ctx.post("/api/quiz/submit", {
      data: { answers: [{ question_code: "Q1", answer_code: "A" }] },
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  // Volle Quiz-Submission mit echten 12 Antworten ueberlassen wir
  // scripts/test_e2e.ts (umgeht den Cookie-Pfad und nutzt service_role) —
  // hier testen wir die Validierungs- + Auth-Schicht der Route.
  test("happy path: minimaler Body wird angenommen wenn der quiz_scoring-Datensatz das Mapping kennt", async ({
    request,
  }) => {
    test.skip(
      true,
      "Echte 12-Antworten-Submission veraendert customers.taste_type_id und destabilisiert weitere Tests; deckt scripts/test_e2e.ts ab."
    );
  });
});
