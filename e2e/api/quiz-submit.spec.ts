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

  test("401 ohne Auth", async () => {
    const res = await fetch("http://localhost:3000/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: [{ question_code: "Q1", answer_code: "A" }] }),
    });
    expect(res.status).toBe(401);
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
